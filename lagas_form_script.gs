// ============================================================
// LAGAS – Caracterización de Usuarios Ciclistas
// Google Apps Script → pegar en script.google.com y ejecutar
// ============================================================

function crearFormularioLAGAS() {
  var form = FormApp.create('LAGAS – Perfil Ciclista & Nutrición');

  form.setDescription(
    'Ayúdanos a conocerte mejor para personalizar tu experiencia LAGAS. ' +
    'Tus respuestas nos permitirán ofrecerte las mejores opciones de nutrición ' +
    'para cada ruta.'
  );
  form.setConfirmationMessage(
    '¡Gracias por completar el formulario! Tu perfil LAGAS está listo.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);

  // ----------------------------------------------------------
  // SECCIÓN 1 – Datos Personales
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('1. Datos Personales')
    .setHelpText('Información básica para armar tu perfil.');

  form.addMultipleChoiceItem()
    .setTitle('¿Cuál es tu rango de edad?')
    .setChoiceValues([
      'Menor de 18 años',
      '18 – 24 años',
      '25 – 34 años',
      '35 – 44 años',
      '45 – 54 años',
      '55 – 64 años',
      '65 años o más'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 2 – Perfil Ciclista
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('2. Perfil Ciclista')
    .setHelpText('Cuéntanos sobre tus hábitos en la bici.');

  form.addMultipleChoiceItem()
    .setTitle('¿Cómo te defines como ciclista?')
    .setChoiceValues([
      'Recreativo / Casual (paseos ocasionales)',
      'Cicloturista (viajes y rutas largas)',
      'Amateur competitivo (carreras o fondos)',
      'Ciclista de montaña / MTB',
      'Ciclista urbano / Commuter',
      'Ciclista de gravel',
      'Otro'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuántos kilómetros rodas a la semana en promedio?')
    .setChoiceValues([
      'Menos de 50 km',
      '50 – 100 km',
      '101 – 200 km',
      '201 – 350 km',
      '351 – 500 km',
      'Más de 500 km'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuántos kilómetros recorres en tu salida de fin de semana habitual?')
    .setChoiceValues([
      'Menos de 30 km',
      '30 – 60 km',
      '61 – 100 km',
      '101 – 150 km',
      '151 – 200 km',
      'Más de 200 km'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 3 – Nutrición General
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('3. Nutrición General')
    .setHelpText('Cuéntanos sobre tus hábitos alimenticios.');

  form.addMultipleChoiceItem()
    .setTitle('¿Cuál es tu tipo de alimentación habitual?')
    .setChoiceValues([
      'Omnívoro (como de todo)',
      'Vegetariano',
      'Vegano',
      'Flexitariano (mayormente vegetal, algo de carne)',
      'Sin gluten',
      'Sin lactosa',
      'Dieta paleo / cetogénica',
      'Otro'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cómo calificarías tu conocimiento sobre nutrición deportiva?')
    .setChoiceValues([
      'Nulo – nunca he prestado atención a la nutrición en el deporte',
      'Básico – sé que debo comer bien antes y después de rodar',
      'Intermedio – conozco conceptos como carga de carbohidratos y proteínas',
      'Avanzado – manejo periodización nutricional, macros y timing',
      'Experto – soy nutricionista o trabajo con uno'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 4 – Nutrición en Ruta
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('4. Nutrición en Ruta')
    .setHelpText('¿Cómo te alimentas mientras pedaleás?');

  var checkboxPrefs = form.addCheckboxItem();
  checkboxPrefs
    .setTitle('¿Qué tipo de nutrición usas habitualmente durante tus salidas? (selecciona todas las que apliquen)')
    .setChoiceValues([
      'Agua sola',
      'Agua con electrolitos en polvo',
      'Bebidas isotónicas envasadas',
      'Geles energéticos',
      'Barras energéticas',
      'Queques / pasteles de carbohidratos (arroz, avena, etc.)',
      'Fruta fresca (plátano, dátiles, etc.)',
      'Comida real (sándwiches, empanadas, etc.)',
      'Suplementos específicos (BCAA, cafeína, etc.)',
      'No suelo comer ni beber nada especial'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuál es tu estrategia preferida de avituallamiento durante una salida larga?')
    .setChoiceValues([
      'Llevo todo lo que necesito desde el inicio (mochila, bolsillos)',
      'Prefiero parar en tiendas / cafeterías en el camino',
      'Combino: salgo con lo básico y reabastezco en ruta',
      'Depende del terreno y duración de la salida'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 5 – Preferencias de Productos LAGAS
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('5. Preferencias de Productos LAGAS')
    .setHelpText('Esto nos ayuda a personalizar tu kit o suscripción.');

  var grid = form.addGridItem();
  grid.setTitle('¿Cuánto usas o te interesa cada tipo de producto en ruta?')
    .setRows([
      'Agua con polvos / electrolitos',
      'Geles energéticos',
      'Queques / pasteles de carbohidratos caseros o artesanales',
      'Barras energéticas empacadas',
      'Bebidas isotónicas listas para tomar'
    ])
    .setColumns([
      'No me interesa',
      'Poco interés',
      'Interés moderado',
      'Me interesa mucho',
      'Es lo que más uso'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Qué formato de nutrición preferiría en un kit LAGAS?')
    .setChoiceValues([
      'Solo polvos e hidratación',
      'Solo productos sólidos (queques, barras)',
      'Solo geles',
      'Mix equilibrado de todos los formatos',
      'Quiero armar mi propio kit personalizado'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Cuál sería tu modalidad ideal de compra en LAGAS?')
    .setChoiceValues([
      'Kit único por salida (compra puntual)',
      'Kit mensual (suscripción fija cada mes)',
      'Suscripción flexible (ajusto cantidad cada mes)',
      'Combo ruta: nutrición calculada según mi ruta de Strava'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 6 – Strava & Tecnología
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('6. Strava & Tecnología')
    .setHelpText('Para conectar tu experiencia LAGAS con tus rutas reales.');

  form.addMultipleChoiceItem()
    .setTitle('¿Tienes cuenta en Strava?')
    .setChoiceValues([
      'Sí, la uso regularmente',
      'Sí, pero casi no la uso',
      'No tengo, pero me interesa',
      'No tengo y no me interesa'
    ])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿Te interesaría que LAGAS calcule tu nutrición automáticamente según tus rutas de Strava?')
    .setChoiceValues([
      'Sí, ¡sería increíble!',
      'Podría ser útil, pero no es fundamental',
      'No, prefiero configurar yo mismo mi nutrición',
      'No uso Strava'
    ])
    .setRequired(true);

  // ----------------------------------------------------------
  // SECCIÓN 7 – Cierre
  // ----------------------------------------------------------
  form.addSectionHeaderItem()
    .setTitle('7. Comentarios adicionales')
    .setHelpText('Cualquier cosa que quieras contarnos.');

  form.addParagraphTextItem()
    .setTitle('¿Hay algo más que quieras que sepamos sobre tu perfil o necesidades nutricionales?')
    .setRequired(false);

  // ----------------------------------------------------------
  // Resultado
  // ----------------------------------------------------------
  Logger.log('✅ Formulario creado: ' + form.getEditUrl());
  Logger.log('🔗 URL para responder: ' + form.getPublishedUrl());

  SpreadsheetApp.getUi
    ? SpreadsheetApp.getActiveSpreadsheet().toast(
        '¡Formulario LAGAS creado! Revisa el Logger para el link.',
        '✅ Listo',
        10
      )
    : null;
}
