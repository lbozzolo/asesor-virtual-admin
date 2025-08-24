import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Obtiene el valor de una variable primero desde process.env y si no existe
 * intenta leer un Secret de Google Secret Manager con el mismo nombre.
 * Lanza error si no se puede resolver.
 */
export async function getEnvOrSecret(name: string): Promise<string> {
  const direct = process.env[name];
  if (direct && direct.trim()) return direct.trim();

  const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_CONFIG && safeParseProjectId(process.env.FIREBASE_CONFIG);
  if (!projectId) throw new Error('GCLOUD_PROJECT/GOOGLE_CLOUD_PROJECT no definido para resolver secreto ' + name);

  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });
  const payload = version.payload?.data?.toString('utf8').trim();
  if (!payload) throw new Error(`Secreto ${name} vacío o no accesible`);
  return payload;
}

function safeParseProjectId(firebaseConfigRaw?: string): string | undefined {
  try {
    if (!firebaseConfigRaw) return undefined;
    const obj = JSON.parse(firebaseConfigRaw);
    return obj.projectId;
  } catch {
    return undefined;
  }
}
