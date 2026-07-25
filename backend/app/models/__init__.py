"""Importa todos los modelos para que Base.metadata los conozca (Alembic, create_all)."""
from app.models.base import Base
from app.models.tenant import Empresa
from app.models.user import Usuario
from app.models.perfil import Perfil
from app.models.area import Area
from app.models.evaluado import Evaluado
from app.models.empresa_test import EmpresaTest
from app.models.asignacion import Asignacion
from app.models.resultado import Resultado
from app.models.informe_integral import InformeIntegral
from app.models.notificacion import Notificacion
from app.models.evaluacion import (
    EvalCampania,
    EvalCompetencia,
    EvalEvaluador,
    EvalFormulario,
    EvalPregunta,
)
from app.models.persona import Persona
from app.models.vacante import Vacante
from app.models.postulacion import Postulacion
from app.models.notificacion_vacante import NotificacionVacante
from app.models.evento_comercial import EventoComercial
from app.models.evaluacion_postulante import AccesoResultado, EventoEvaluacion, OutboxEvento

__all__ = [
    "Base", "Empresa", "Usuario", "Perfil", "Area", "Evaluado",
    "EmpresaTest", "Asignacion", "Resultado", "InformeIntegral", "Notificacion",
    "EvalFormulario", "EvalCompetencia", "EvalPregunta", "EvalCampania", "EvalEvaluador",
    "Persona", "Vacante", "Postulacion", "NotificacionVacante", "EventoComercial",
    "AccesoResultado", "EventoEvaluacion", "OutboxEvento",
]
