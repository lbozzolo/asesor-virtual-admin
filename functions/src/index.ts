/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as functionsCore from 'firebase-functions';
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Dev key helper (lee primero variable de entorno y luego runtime config: firebase functions:config:set dev.reset_key="valor")
const DEV_KEY = process.env.DEV_RESET_KEY || (functionsCore.config().dev?.reset_key || '');

type UserRole = "superadmin" | "admin" | "operador";

interface UserData {
    uid: string;
    email: string;
    role: UserRole;
    suspended: boolean;
}

// Helper function to get user's custom claims (role)
const getUserRole = async (uid: string): Promise<UserRole> => {
    try {
        const userRecord = await admin.auth().getUser(uid);
        return (userRecord.customClaims?.role || "operador") as UserRole;
    } catch (error) {
        logger.error(`Error getting user role for uid: ${uid}`, error);
        // Return a default role if user is not found to avoid crashing.
        // The calling function should handle permissions based on this.
        return "operador";
    }
};

// Cloud Function to create a user
export const createUser = onCall(async (request) => {
    logger.info("Attempting to create user with data:", { data: request.data, auth: request.auth?.token.email });

    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes estar autenticado para crear usuarios.");
    }

    const { email, password, role } = request.data;
    if (!email || !password || !role) {
        throw new HttpsError("invalid-argument", "Faltan los campos email, password o role.");
    }

    const requesterRole = await getUserRole(request.auth.uid);
    
    // Authorization check
    if (requesterRole !== "superadmin" && requesterRole !== "admin") {
        throw new HttpsError("permission-denied", "No tienes permiso para crear usuarios.");
    }
    if (requesterRole === "admin" && (role === "admin" || role === "superadmin")) {
        throw new HttpsError("permission-denied", "Los administradores solo pueden crear operadores.");
    }

    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            emailVerified: true,
        });

        // Set custom claims for the user's role
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });

        // Create user document in Firestore
        await db.collection("users").doc(userRecord.uid).set({
            email: userRecord.email,
            role: role,
            suspended: false,
        });

        logger.info("User created successfully:", { uid: userRecord.uid, email: userRecord.email });
        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        logger.error("Error creating user:", error);
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError("already-exists", "El correo electrónico ya está en uso por otra cuenta.");
        }
        throw new HttpsError("internal", "Ocurrió un error al crear el usuario.");
    }
});


// Cloud Function to update a user's role
export const updateUserRole = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes estar autenticado.");
    }
    const { uid, role } = request.data;
    if (!uid || !role) {
        throw new HttpsError("invalid-argument", "Faltan los campos uid o role.");
    }

    const requesterRole = await getUserRole(request.auth.uid);
    const targetUserRecord = await admin.auth().getUser(uid);
    const targetUserRole = (targetUserRecord.customClaims?.role || "operador") as UserRole;
    
    // Hierarchy check
    const roleHierarchy = { "operador": 1, "admin": 2, "superadmin": 3 };
    if (roleHierarchy[requesterRole] <= roleHierarchy[targetUserRole]) {
         throw new HttpsError("permission-denied", "No puedes modificar un usuario con un rol igual o superior al tuyo.");
    }

    if (requesterRole === "admin" && (role === "admin" || role === "superadmin")) {
        throw new HttpsError("permission-denied", "Los administradores no pueden asignar el rol de admin o superadmin.");
    }

    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        await db.collection("users").doc(uid).update({ role });
        logger.info(`User role updated successfully for UID: ${uid} to ${role}`);
        return { success: true };
    } catch (error) {
        logger.error("Error updating user role:", error);
        throw new HttpsError("internal", "Error al actualizar el rol del usuario.");
    }
});

// Cloud Function to suspend/reactivate a user
export const toggleUserSuspension = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "Debes estar autenticado.");
    }
    const { uid, suspend } = request.data;
    if (!uid || typeof suspend !== 'boolean') {
        throw new HttpsError("invalid-argument", "Faltan los campos uid o suspend.");
    }
    
    if (request.auth.uid === uid) {
        throw new HttpsError("invalid-argument", "No puedes suspenderte a ti mismo.");
    }

    const requesterRole = await getUserRole(request.auth.uid);
    const targetUserRecord = await admin.auth().getUser(uid);
    const targetUserRole = (targetUserRecord.customClaims?.role || "operador") as UserRole;
    
    // Hierarchy check
    const roleHierarchy = { "operador": 1, "admin": 2, "superadmin": 3 };
    if (roleHierarchy[requesterRole] <= roleHierarchy[targetUserRole]) {
         throw new HttpsError("permission-denied", "No puedes modificar un usuario con un rol igual o superior al tuyo.");
    }

    try {
        await admin.auth().updateUser(uid, { disabled: suspend });
        await db.collection("users").doc(uid).update({ suspended: suspend });
        logger.info(`User suspension toggled for UID: ${uid}. Suspended: ${suspend}`);
        return { success: true, message: `Usuario ${suspend ? "suspendido" : "reactivado"}.` };
    } catch (error) {
        logger.error("Error toggling user suspension:", error);
        throw new HttpsError("internal", "Error al cambiar el estado de suspensión del usuario.");
    }
});

// Generar enlace de restablecimiento de contraseña (solo desarrollo) 
// Devuelve un link para abrir manualmente sin enviar correo. Útil en entorno local.
export const devGeneratePasswordResetLink = onCall<{ email: string; devKey?: string }>(async (request) => {
    // Solo disponible fuera de producción
    if (process.env.NODE_ENV === 'production') {
        throw new HttpsError('permission-denied', 'No disponible en producción.');
    }

    const { email, devKey } = request.data || {};
    if (!email) {
        throw new HttpsError('invalid-argument', 'Falta email.');
    }

    // Permitir dos modos:
    // 1. Usuario autenticado con rol admin/superadmin.
    // 2. Sin autenticación pero aportando devKey coincidente con variable de entorno DEV_RESET_KEY (para flujos de “olvidé mi contraseña” sin sesión).
    let authorized = false;
    if (request.auth) {
        const role = await getUserRole(request.auth.uid);
        if (['admin', 'superadmin'].includes(role)) authorized = true;
        } else if (devKey && DEV_KEY && devKey === DEV_KEY) {
        authorized = true;
    }

    if (!authorized) {
        throw new HttpsError('permission-denied', 'No autorizado para generar enlace.');
    }

    try {
        const link = await admin.auth().generatePasswordResetLink(email, {
            url: 'http://localhost:3000/login'
        });
        logger.info('Reset link generado (dev)', { email, by: request.auth?.uid || 'devKey' });
        return { link };
    } catch (error) {
        logger.error('Error generando reset link', error);
        throw new HttpsError('internal', 'No se pudo generar el enlace.');
    }
});

// Establecer (o generar) una contraseña para un usuario en desarrollo
export const devSetUserPassword = onCall<{ uid?: string; email?: string; newPassword?: string; devKey?: string }>(async (request) => {
    if (process.env.NODE_ENV === 'production') {
        throw new HttpsError('permission-denied', 'No disponible en producción.');
    }
    const { uid, email, newPassword, devKey } = request.data || {};
    if (!uid && !email) throw new HttpsError('invalid-argument', 'Falta uid o email.');

    let authorized = false;
    if (request.auth) {
        const role = await getUserRole(request.auth.uid);
        if (['admin','superadmin'].includes(role)) authorized = true;
        } else if (devKey && DEV_KEY && devKey === DEV_KEY) {
        authorized = true;
    }
    if (!authorized) throw new HttpsError('permission-denied', 'No autorizado.');

    let targetUid = uid;
    if (!targetUid && email) {
        try {
            const userRecord = await admin.auth().getUserByEmail(email);
            targetUid = userRecord.uid;
        } catch (e) {
            throw new HttpsError('not-found', 'No se encontró un usuario con ese email.');
        }
    }

    if (!targetUid) throw new HttpsError('invalid-argument', 'No se pudo resolver el UID.');

    const pwd = newPassword && newPassword.length >= 8 ? newPassword : generateRandomPassword();
    try {
        await admin.auth().updateUser(targetUid, { password: pwd });
        logger.info('Password dev seteada', { target: targetUid, by: request.auth?.uid || 'devKey' });
        return { uid: targetUid, password: pwd };
    } catch (e) {
        logger.error('Error seteando password dev', e);
        throw new HttpsError('internal', 'No se pudo actualizar la contraseña.');
    }
});

function generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%*?';
    const len = 14;
    let out = '';
    for (let i=0;i<len;i++) out += chars[Math.floor(Math.random()*chars.length)];
    return out;
}
