import os
import unittest

os.environ.setdefault("DATABASE_URL", "postgresql://user:pass@localhost/test")

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.persona_portal import PersonaPerfilOut, PersonaPerfilUpdate


class Phase4ContractsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.spec = TestClient(app).get("/openapi.json").json()

    def test_candidate_portal_endpoints_are_exposed(self):
        expected = {
            "/api/personas/me/perfil": {"get", "put"},
            "/api/personas/me/cv": {"post"},
            "/api/personas/me/password": {"post"},
            "/api/personas/me/postulaciones": {"get"},
            "/api/personas/me/postulaciones/{postulacion_id}": {"get"},
            "/api/personas/me/consentimientos": {"get"},
        }
        for path, methods in expected.items():
            self.assertIn(path, self.spec["paths"])
            self.assertTrue(methods.issubset(self.spec["paths"][path]))

    def test_profile_contract_never_exposes_security_fields(self):
        output_fields = set(PersonaPerfilOut.model_fields)
        self.assertNotIn("password_hash", output_fields)
        self.assertNotIn("reset_token", output_fields)
        self.assertNotIn("reset_expira", output_fields)

    def test_profile_update_cannot_change_identity_or_email(self):
        fields = set(PersonaPerfilUpdate.model_fields)
        self.assertNotIn("id", fields)
        self.assertNotIn("email", fields)
        self.assertNotIn("activo", fields)

    def test_runner_start_requires_explicit_consent(self):
        operation = self.spec["paths"]["/api/asignaciones/{asignacion_id}/iniciar"]["post"]
        schema = operation["requestBody"]["content"]["application/json"]["schema"]
        self.assertEqual(schema["$ref"], "#/components/schemas/IniciarEvaluacionIn")


if __name__ == "__main__":
    unittest.main()
