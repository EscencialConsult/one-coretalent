import os
import unittest
import uuid

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/test")

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.auth import PersonaAuthOut


class Phase1ContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_persona_me_is_exposed_in_openapi(self):
        spec = self.client.get("/openapi.json").json()
        self.assertIn("/api/auth/persona/me", spec["paths"])
        response_schema = spec["paths"]["/api/auth/persona/me"]["get"]["responses"]["200"]["content"][
            "application/json"
        ]["schema"]
        self.assertEqual(response_schema["$ref"], "#/components/schemas/PersonaAuthOut")

    def test_request_id_is_generated_and_preserved(self):
        generated = self.client.get("/")
        self.assertTrue(generated.headers["x-request-id"])

        preserved = self.client.get("/", headers={"X-Request-ID": "soporte-123"})
        self.assertEqual(preserved.headers["x-request-id"], "soporte-123")

    def test_persona_auth_contract_exposes_only_minimum_identity(self):
        data = PersonaAuthOut(
            id=uuid.uuid4(),
            email="persona@example.com",
            nombre="Ana",
            apellido="Pérez",
        ).model_dump()
        self.assertEqual(set(data), {"id", "email", "nombre", "apellido"})

    def test_evaluado_portal_contracts_are_exposed(self):
        spec = self.client.get("/openapi.json").json()
        self.assertIn("/api/auth/evaluado/login", spec["paths"])
        self.assertIn("/api/yo/me", spec["paths"])
        self.assertIn("/api/yo/asignaciones", spec["paths"])
        self.assertIn("/api/yo/asignaciones/{slug}/resultado", spec["paths"])
        self.assertIn("/api/tests/{slug}/preguntas", spec["paths"])


if __name__ == "__main__":
    unittest.main()
