import unittest

from app.api.routes.resultados import _sin_respuestas_crudas
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


if __name__ == "__main__":
    unittest.main()
