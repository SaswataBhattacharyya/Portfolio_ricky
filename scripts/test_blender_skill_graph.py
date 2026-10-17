#!/usr/bin/env python3
"""Offline tests of the routing contract (no Blender or network required)."""
import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "blender_skill_graph.py"
spec = importlib.util.spec_from_file_location("webberick_blender_graph", SCRIPT)
graphlib = importlib.util.module_from_spec(spec)
spec.loader.exec_module(graphlib)


class BlenderSkillGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = graphlib.load_graph()

    def test_catalog_has_all_four_projects_and_44_skills(self):
        self.assertEqual(len(graphlib.skill_names(self.data)), 44)
        self.assertEqual([len(s["skills"]) for s in self.data["sources"]], [13, 1, 30])
        self.assertEqual(self.data["mcp"]["repo"], "ahujasid/mcp-for-blender")

    def test_no_orphan_routes_or_edges(self):
        self.assertEqual(graphlib.validate(self.data), [])

    def test_reference_route_is_selected(self):
        matches = graphlib.detect_routes(self.data, "Recreate this reference image exactly")
        self.assertTrue(matches)
        self.assertEqual(matches[0][1]["id"], "reference")

    def test_vague_feedback_selects_repair(self):
        matches = graphlib.detect_routes(self.data, "This model feels too chunky. Fix it.")
        self.assertTrue(matches)
        self.assertEqual(matches[0][1]["id"], "repair")

    def test_abstract_homepage_uses_procedural_skill(self):
        matches = graphlib.detect_routes(self.data, "Build a procedural abstract animation for the homepage")
        self.assertTrue(any(r["id"] == "procedural" for _, r in matches))
        self.assertTrue(any(r["id"] == "motion" for _, r in matches))
        self.assertTrue(any(r["id"] == "web-asset" for _, r in matches))

    def test_mermaid_lists_all_specialists(self):
        markup = graphlib.mermaid(self.data)
        for skill in graphlib.skill_names(self.data):
            self.assertIn('["' + skill + '"]', markup)
        self.assertIn("flowchart LR", markup)


if __name__ == "__main__":
    unittest.main()
