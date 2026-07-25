import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

from fastapi import HTTPException

from app.api.deps import ActorActual
from app.api.routes.resultados import _autorizar_resultado, _sin_respuestas_crudas
from app.main import app


class Phase5ContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = app.openapi()

    def test_sensitive_report_endpoint_is_exposed(self):
        path = self.schema["paths"]["/api/informes/{resultado_id}"]
        self.assertIn("get", path)

    def test_raw_answers_are_removed_recursively(self):
        value = {
            "puntaje": 10,
            "respuestas": {"1": 4},
            "dimensiones": [
                {"nombre": "A", "score": 8, "raw_answers": [1, 2]},
                {"nombre": "B", "interpretacion": "Adecuada"},
            ],
        }
        clean = _sin_respuestas_crudas(value)
        self.assertEqual(clean["puntaje"], 10)
        self.assertNotIn("respuestas", clean)
        self.assertNotIn("raw_answers", clean["dimensiones"][0])

    def test_report_contract_has_no_write_method(self):
        path = self.schema["paths"]["/api/informes/{resultado_id}"]
        self.assertEqual(set(path), {"get"})


class Phase5PermissionsTest(unittest.IsolatedAsyncioTestCase):
    async def test_company_requires_an_active_result_access(self):
        tenant_id = uuid.uuid4()
        resultado = SimpleNamespace(
            id=uuid.uuid4(),
            persona_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
        )
        actor = ActorActual(tipo="empresa", id=uuid.uuid4(), tenant_id=tenant_id)
        db = SimpleNamespace(
            execute=AsyncMock(
                return_value=SimpleNamespace(scalar_one_or_none=lambda: None)
            )
        )

        with self.assertRaises(HTTPException) as contexto:
            await _autorizar_resultado(resultado, actor, db)

        self.assertEqual(contexto.exception.status_code, 404)

    async def test_company_can_read_with_an_active_result_access(self):
        tenant_id = uuid.uuid4()
        resultado = SimpleNamespace(
            id=uuid.uuid4(),
            persona_id=uuid.uuid4(),
            tenant_id=uuid.uuid4(),
        )
        actor = ActorActual(tipo="empresa", id=uuid.uuid4(), tenant_id=tenant_id)
        db = SimpleNamespace(
            execute=AsyncMock(
                return_value=SimpleNamespace(
                    scalar_one_or_none=lambda: SimpleNamespace(id=uuid.uuid4())
                )
            )
        )

        autorizado = await _autorizar_resultado(resultado, actor, db)

        self.assertEqual(autorizado, tenant_id)


if __name__ == "__main__":
    unittest.main()
