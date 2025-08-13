import type { NextApiRequest, NextApiResponse } from 'next';

const SHEET_ID = '1vNmBjrX9VDO3v-xXxHqrxCqAX_HsO2rxQom_pKa9EqQ';
const SHEET_NAME = 'cursos';
const GOOGLE_API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  if (!GOOGLE_API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key de Google Sheets' });
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('No se pudo obtener los datos de Google Sheets');
    }
    const data = await response.json();
    res.status(200).json({ values: data.values });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar Google Sheets' });
  }
}
