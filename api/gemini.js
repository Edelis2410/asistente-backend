export default async function handler(req, res) {
  // Solo permitir peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { selectedText, context } = req.body;

  if (!selectedText || selectedText.trim() === '') {
    return res.status(400).json({ error: 'No se proporcionó texto seleccionado' });
  }

  // La API Key se lee desde variable de entorno (segura)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('Falta la variable de entorno GEMINI_API_KEY');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Prompt IDÉNTICO al que usted tenía en app.js (solo cambian los nombres de las variables)
  const prompt = `Eres un asistente academico especializado en explicar terminos en contexto.

El usuario ha seleccionado la siguiente palabra o frase: "${selectedText}"

El texto completo donde aparece es: "${context || selectedText}"

Por favor, explica que significa esta palabra o frase EN EL CONTEXTO ESPECIFICO de este texto.
Si la palabra tiene diferentes significados segun la disciplina (medicina, derecho, informatica, etc.), enfocate en el que corresponde al texto proporcionado.

Instrucciones:
- Responde en español
- Se claro, conciso y directo
- No uses markdown ni formato especial
- La explicacion debe ser de maximo 3 oraciones
- Enfocate en el significado contextual, no des definiciones genericas`;

  try {
    const respuesta = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 300 }
      })
    });

    if (!respuesta.ok) {
      const errorData = await respuesta.json();
      console.error('Error de Gemini:', errorData);
      return res.status(502).json({ error: 'Error al consultar Gemini API' });
    }

    const datos = await respuesta.json();
    let explanation = 'No se pudo obtener una explicación.';
    if (datos.candidates && datos.candidates[0] && datos.candidates[0].content) {
      explanation = datos.candidates[0].content.parts[0].text;
    }
    return res.status(200).json({ explanation });
  } catch (error) {
    console.error('Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}