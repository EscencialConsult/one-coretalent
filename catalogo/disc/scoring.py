"""
Motor de cálculo DETERMINISTA — Test DISC Profesional (Método Cleaver, 28 grupos).

Port de Test DISC/script.gs (calcularResultadosDISC + PROFILES + PATRONES_COMBINADOS),
CORRIGIENDO el input: el .gs recibía las respuestas codificadas con pérdida (D e I -> 5,
S y C -> 1) y "adivinaba" D vs I por posición. Acá el runner envía la LETRA REAL elegida
(D/I/S/C) como MÁS y como MENOS por grupo, así los puntajes por dimensión son EXACTOS.
La lógica de patrón/perfil/combinados se mantiene fiel al .gs. Sin IA.

Entrada: dict {"mas": {id: "D"|"I"|"S"|"C"}, "menos": {id: ...}} (ids 1-28).
Salida:  masScores/menosScores/netoScores por dimensión, intensidades, radar, patrón,
         perfil (label/descripción/fortalezas/ambiente/comunicación/estilo), resumen por
         ejes (Activo D/I vs Reservado S/C), estabilidad Parte I vs Parte II y detalle.
"""
from __future__ import annotations

import json
from pathlib import Path

_DIR = Path(__file__).parent
with (_DIR / "preguntas.json").open(encoding="utf-8") as _f:
    _GRUPOS = {g["id"]: g for g in json.load(_f)["grupos"]}

DIMS = ["D", "I", "S", "C"]

PROFILES = {
    "D": {
        "nombre": "Dominante - Orientado a Resultados",
        "descripcion": "Personas directas, decididas y orientadas a resultados. Les gusta el control, enfrentar desafíos y tomar decisiones rápidas. Son competitivas y buscan alcanzar objetivos de manera eficiente.",
        "caracteristicas": ["Toma de decisiones rápida y efectiva", "Alta orientación a resultados y logros", "Capacidad para enfrentar desafíos directamente", "Liderazgo natural en situaciones de presión", "Enfoque en la eficiencia y productividad"],
        "ambiente_ideal": "Entornos dinámicos con autonomía, desafíos constantes y oportunidades de liderazgo donde puedan tomar decisiones independientes.",
        "comunicacion": "Directa, concisa y orientada a resultados. Prefieren hechos concretos y soluciones rápidas sin rodeos.",
        "estilo_trabajo": "Independiente, competitivo y orientado a objetivos. Prosperan con metas claras y libertad para alcanzarlas.",
    },
    "I": {
        "nombre": "Influyente - Entusiasta y Sociable",
        "descripcion": "Personas extrovertidas, optimistas y persuasivas. Disfrutan socializar, influir en otros y crear un ambiente positivo. Son comunicativas y les motiva el reconocimiento social.",
        "caracteristicas": ["Excelentes habilidades de comunicación interpersonal", "Capacidad natural para motivar e inspirar", "Entusiasmo contagioso y energía positiva", "Creatividad en la resolución de problemas", "Habilidad para construir redes y relaciones"],
        "ambiente_ideal": "Espacios colaborativos y sociales con oportunidades de interacción frecuente, trabajo en equipo y reconocimiento público.",
        "comunicacion": "Expresiva, entusiasta y persuasiva. Usan historias y emociones para conectar con otros.",
        "estilo_trabajo": "Colaborativo, creativo y orientado a personas. Disfrutan del trabajo en equipo y la innovación.",
    },
    "S": {
        "nombre": "Estable - Colaborador y Paciente",
        "descripcion": "Personas pacientes, leales y orientadas al trabajo en equipo. Valoran la estabilidad, son confiables y prefieren ambientes predecibles. Son buenos escuchando y apoyando a otros.",
        "caracteristicas": ["Lealtad y compromiso excepcionales", "Paciencia y estabilidad emocional", "Excelentes habilidades de escucha activa", "Capacidad para mantener la calma bajo presión", "Orientación al servicio y apoyo a otros"],
        "ambiente_ideal": "Entornos estables y predecibles con rutinas claras, trabajo en equipo consistente y oportunidades para ayudar a otros.",
        "comunicacion": "Calmada, empática y considerada. Prefieren conversaciones profundas y significativas.",
        "estilo_trabajo": "Metódico, consistente y cooperativo. Valoran la armonía y la estabilidad del equipo.",
    },
    "C": {
        "nombre": "Cumplidor - Analítico y Preciso",
        "descripcion": "Personas analíticas, precisas y orientadas a la calidad. Valoran la exactitud, siguen procedimientos establecidos y buscan perfección en su trabajo. Son detallistas y sistemáticas.",
        "caracteristicas": ["Alta atención al detalle y precisión", "Pensamiento analítico y sistemático", "Compromiso con la calidad y excelencia", "Capacidad para seguir procesos complejos", "Toma de decisiones basada en datos y análisis"],
        "ambiente_ideal": "Espacios estructurados con estándares claros, tiempo para análisis profundo y oportunidades para trabajar con precisión.",
        "comunicacion": "Precisa, detallada y basada en hechos. Prefieren información completa antes de tomar decisiones.",
        "estilo_trabajo": "Sistemático, organizado y orientado a la calidad. Requieren claridad y tiempo para análisis.",
    },
}

PATRONES_COMBINADOS = {
    "DI": {"nombre": "Inspirador - Líder Carismático", "descripcion": "Combina la orientación a resultados con habilidades sociales excepcionales. Líderes dinámicos que inspiran y motivan mientras logran objetivos.", "fortalezas": "Liderazgo carismático, capacidad de influencia y motivación, orientación a resultados con conexión interpersonal."},
    "DS": {"nombre": "Creador - Líder Paciente", "descripcion": "Equilibrio entre la determinación y la consideración por otros. Líderes efectivos que logran resultados manteniendo la armonía del equipo.", "fortalezas": "Liderazgo estable, capacidad de decisión con empatía, persistencia en el logro de objetivos."},
    "DC": {"nombre": "Desafiador - Líder Analítico", "descripcion": "Combinación de decisión rápida con análisis profundo. Líderes estratégicos que toman decisiones basadas en datos.", "fortalezas": "Pensamiento estratégico, toma de decisiones basada en análisis, orientación a resultados medibles."},
    "IS": {"nombre": "Asesor - Facilitador Empático", "descripcion": "Mezcla de entusiasmo con empatía profunda. Excelentes en roles de apoyo, coaching y facilitación de equipos.", "fortalezas": "Empatía excepcional, capacidad de motivación y apoyo, construcción de relaciones duraderas."},
    "IC": {"nombre": "Evaluador - Analista Creativo", "descripcion": "Combina creatividad social con pensamiento analítico. Buenos para roles que requieren innovación basada en datos.", "fortalezas": "Análisis creativo, capacidad de persuasión basada en hechos, equilibrio entre intuición y lógica."},
    "SC": {"nombre": "Objetivo - Especialista Confiable", "descripcion": "Fusión de estabilidad con precisión. Profesionales confiables que mantienen altos estándares de calidad consistentemente.", "fortalezas": "Consistencia excepcional, atención al detalle con paciencia, confiabilidad a largo plazo."},
}

_BALANCED = {
    "fortalezas": ["Versatilidad en diferentes contextos y situaciones", "Capacidad de adaptación a diversos estilos de trabajo", "Equilibrio entre acción y reflexión", "Flexibilidad en la comunicación interpersonal", "Potencial para desarrollar múltiples competencias"],
    "ambiente_ideal": "Entornos variados que permitan aplicar diferentes habilidades según las necesidades del momento.",
    "estilo_trabajo": "Flexible y adaptable, capaz de ajustarse a diferentes demandas y situaciones.",
    "comunicacion": "Adaptativa, capaz de ajustar el estilo según el interlocutor y contexto.",
    "descripcion": "Tu perfil muestra un balance entre las diferentes dimensiones DISC, indicando versatilidad y adaptabilidad en diversos contextos profesionales.",
}


def _mapa(d) -> dict:
    """Normaliza {id: letra} aceptando claves str/int y letras en cualquier caso."""
    out = {}
    if isinstance(d, dict):
        for k, v in d.items():
            try:
                out[int(k)] = str(v).strip().upper()
            except (TypeError, ValueError):
                continue
    return out


def _nivel_eje(pct: int) -> str:
    return "Alto" if pct >= 50 else "Moderado"


def _resumen_ejes(mas: dict, menos: dict, ids: list[int]) -> dict:
    masDI = sum(1 for i in ids if mas.get(i) in ("D", "I"))
    masSC = sum(1 for i in ids if mas.get(i) in ("S", "C"))
    menosDI = sum(1 for i in ids if menos.get(i) in ("D", "I"))
    menosSC = sum(1 for i in ids if menos.get(i) in ("S", "C"))
    n = len(ids) or 1
    return {
        "masDI": masDI, "masSC": masSC, "menosDI": menosDI, "menosSC": menosSC,
        "masDI_pct": round(masDI / n * 100), "masSC_pct": round(masSC / n * 100),
        "menosDI_pct": round(menosDI / n * 100), "menosSC_pct": round(menosSC / n * 100),
    }


def calcular(respuestas) -> dict:
    mas = _mapa(respuestas.get("mas") if isinstance(respuestas, dict) else {})
    menos = _mapa(respuestas.get("menos") if isinstance(respuestas, dict) else {})

    ids = [g for g in _GRUPOS]
    masScores = {d: sum(1 for i in ids if mas.get(i) == d) for d in DIMS}
    menosScores = {d: sum(1 for i in ids if menos.get(i) == d) for d in DIMS}
    netoScores = {d: masScores[d] - menosScores[d] for d in DIMS}

    # Orden por neto desc, luego mas desc, luego menos asc (port del sort del .gs).
    orden = sorted(DIMS, key=lambda d: (-netoScores[d], -masScores[d], menosScores[d]))
    primary, secondary = orden[0], orden[1]
    delta = netoScores[primary] - netoScores[secondary]

    all_netos_eq = len(set(netoScores.values())) == 1
    all_mas_eq = len(set(masScores.values())) == 1

    if all_netos_eq and all_mas_eq:
        pattern, patron_tipo, is_balanced = "EQUILIBRADO", "Equilibrado", True
        profile_label = "Perfil Equilibrado - Sin predominio claro"
        profile_desc = _BALANCED["descripcion"]
        fortalezas = list(_BALANCED["fortalezas"])
        ambiente, estilo, comunicacion = _BALANCED["ambiente_ideal"], _BALANCED["estilo_trabajo"], _BALANCED["comunicacion"]
    else:
        is_balanced = False
        p = PROFILES[primary]
        profile_label, profile_desc = p["nombre"], p["descripcion"]
        fortalezas = list(p["caracteristicas"])
        ambiente, estilo, comunicacion = p["ambiente_ideal"], p["estilo_trabajo"], p["comunicacion"]
        if netoScores[primary] <= 0:
            pattern, patron_tipo = "ATENUADO", "Atenuado"
        elif delta < 2 and netoScores[secondary] > 0:
            patron_tipo = "Combinado"
            pattern = primary + secondary
            combo = PATRONES_COMBINADOS.get(pattern)
            if combo:
                profile_label = f"{combo['nombre']} ({pattern})"
                profile_desc = f"{combo['descripcion']} {profile_desc}"
                fortalezas.append(combo["fortalezas"])
        else:
            pattern, patron_tipo = primary, "Alto solo"

    # Intensidades (barras) y radar — port del .gs.
    total_abs = sum(abs(netoScores[d]) for d in DIMS)
    intensidades = {d: (round(abs(netoScores[d]) / total_abs * 100) if total_abs else 25) for d in DIMS}
    max_abs = max([abs(netoScores[d]) for d in DIMS] + [1])
    radar = {d: (netoScores[d] / max_abs) * 50 + 50 for d in DIMS}

    # Resumen por ejes (Activo D/I vs Reservado S/C) — total y por parte.
    res_total = _resumen_ejes(mas, menos, ids)
    res_total["nivel_masDI"] = _nivel_eje(res_total["masDI_pct"])
    res_total["nivel_masSC"] = _nivel_eje(res_total["masSC_pct"])
    res_total["nivel_menosDI"] = _nivel_eje(res_total["menosDI_pct"])
    res_total["nivel_menosSC"] = _nivel_eje(res_total["menosSC_pct"])

    ids_p1 = [i for i in ids if _GRUPOS[i]["parte"] == 1]
    ids_p2 = [i for i in ids if _GRUPOS[i]["parte"] == 2]
    p1 = _resumen_ejes(mas, menos, ids_p1)
    p2 = _resumen_ejes(mas, menos, ids_p2)
    dif_mas = abs(p1["masDI"] - p2["masDI"])
    dif_menos = abs(p1["menosDI"] - p2["menosDI"])
    dif_total = dif_mas + dif_menos
    if dif_total <= 4:
        nivel_estab = "Muy estable"
        texto_estab = "Tu comportamiento es muy consistente entre situaciones normales y bajo presión: sos auténtico/a y predecible."
    elif dif_total <= 9:
        nivel_estab = "Estable"
        texto_estab = "Mantenés bastante consistencia entre tu estilo natural y bajo presión, con ajustes menores."
    elif dif_total <= 14:
        nivel_estab = "Moderada"
        texto_estab = "Modificás moderadamente tu conducta bajo presión respecto de tu estilo natural."
    else:
        nivel_estab = "Variable"
        texto_estab = "Cambiás notablemente tu conducta bajo presión: conviene revisar qué exige ese esfuerzo de adaptación."

    detalle = []
    for i in ids:
        g = _GRUPOS[i]
        ml, nl = mas.get(i), menos.get(i)
        detalle.append({
            "id": i, "parte": g["parte"],
            "adjetivos": {d: g[d] for d in DIMS},
            "mas": ml, "menos": nl,
            "mas_texto": g.get(ml, "") if ml else "", "menos_texto": g.get(nl, "") if nl else "",
        })

    return {
        "masScores": masScores, "menosScores": menosScores, "netoScores": netoScores,
        "intensidades": intensidades, "radar": radar,
        "pattern": pattern, "patron_tipo": patron_tipo, "isBalanced": is_balanced,
        "profileLabel": profile_label, "profileDescription": profile_desc,
        "primaryDim": primary, "secondaryDim": secondary,
        "fortalezas": fortalezas, "ambienteIdeal": ambiente, "estiloTrabajo": estilo, "comunicacion": comunicacion,
        "resumen": res_total,
        "estabilidad": {"parte1": p1, "parte2": p2, "dif_mas": dif_mas, "dif_menos": dif_menos, "dif_total": dif_total, "nivel": nivel_estab, "texto": texto_estab},
        "detalle": detalle,
    }


if __name__ == "__main__":
    import pprint
    demo = {"mas": {i: "C" for i in range(1, 29)}, "menos": {i: "I" for i in range(1, 29)}}
    pprint.pprint(calcular(demo))
