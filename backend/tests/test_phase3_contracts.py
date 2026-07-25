import os
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/test")

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.core import engine
from app.main import app
from app.api.routes.evaluaciones_postulantes import finalizar_evaluacion
from app.schemas.evaluacion_postulante import EvaluacionPostulanteCreate, EvaluacionResumenOut


class Phase3ContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.spec = cls.client.get("/openapi.json").json()

    def test_all_proposed_endpoints_are_exposed(self):
        expected = {
            "/api/vacantes/{vacante_id}/postulaciones/{postulacion_id}/evaluaciones": {"get", "post"},
            "/api/personas/me/evaluaciones": {"get"},
            "/api/personas/me/resultados": {"get"},
            "/api/resultados/{resultado_id}": {"get"},
            "/api/asignaciones/{asignacion_id}/iniciar": {"post"},
            "/api/asignaciones/{asignacion_id}/respuestas": {"post"},
            "/api/asignaciones/{asignacion_id}/finalizar": {"post"},
            "/api/accesos-resultados/{acceso_id}/revocar": {"post"},
        }
        for path, methods in expected.items():
            self.assertIn(path, self.spec["paths"])
            self.assertTrue(methods.issubset(self.spec["paths"][path]))

    def test_assignment_input_does_not_accept_persona_id(self):
        self.assertEqual(set(EvaluacionPostulanteCreate.model_fields), {"test_slug"})
        with self.assertRaises(ValidationError):
            EvaluacionPostulanteCreate.model_validate(
                {"test_slug": "big-five", "persona_id": "00000000-0000-0000-0000-000000000000"}
            )

    def test_list_contract_does_not_expose_answers_or_scoring_data(self):
        fields = set(EvaluacionResumenOut.model_fields)
        self.assertNotIn("respuestas", fields)
        self.assertNotIn("respuestas_parciales", fields)
        self.assertNotIn("datos", fields)
        self.assertNotIn("persona_id", fields)

    def test_catalog_and_algorithm_versions_are_stable_hashes(self):
        first = engine.versiones("big-five")
        second = engine.versiones("big-five")
        self.assertEqual(first, second)
        self.assertTrue(all(len(value) == 64 for value in first))
        self.assertNotEqual(first[0], first[1])


class Phase3IdempotencyTest(unittest.IsolatedAsyncioTestCase):
    async def test_finalizar_completed_assignment_returns_existing_summary(self):
        asignacion_id = uuid.uuid4()
        persona = SimpleNamespace(id=uuid.uuid4())
        asignacion = SimpleNamespace(id=asignacion_id, estado="completado")
        resumen = SimpleNamespace(id=asignacion_id, estado="completado")

        with (
            patch(
                "app.api.routes.evaluaciones_postulantes._asignacion_persona",
                new=AsyncMock(return_value=asignacion),
            ) as obtener,
            patch(
                "app.api.routes.evaluaciones_postulantes._resumen",
                new=AsyncMock(return_value=resumen),
            ) as resumir,
        ):
            resultado = await finalizar_evaluacion(
                asignacion_id=asignacion_id,
                background=SimpleNamespace(),
                data=None,
                persona=persona,
                db=SimpleNamespace(),
            )

        self.assertIs(resultado, resumen)
        obtener.assert_awaited_once()
        resumir.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
