#!/usr/bin/env python3
"""Offline route tests. Neither Blender nor Linux administration commands run."""
import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MOD = ROOT / "gnu_linux_skill_graph.py"
spec = importlib.util.spec_from_file_location("gnu_linux_skill_graph", MOD)
graphcli = importlib.util.module_from_spec(spec)
spec.loader.exec_module(graphcli)


class GNULinuxGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = graphcli.get_graph()

    def test_inventory_contains_50_specialists(self):
        skills = graphcli.get_skills(self.graph)
        self.assertEqual(len(skills), 50)
        self.assertEqual([len(s["skills"]) for s in self.graph["sources"]], [42, 5, 3])
        self.assertEqual(len(set(s["name"] for s in skills)), 50)

    def test_no_invalid_routes_or_dependencies(self):
        self.assertEqual(graphcli.graph_issues(self.graph), [])

    def test_linux_mcp_is_optional_and_readonly(self):
        self.assertFalse(self.graph["mcp"]["required"])
        self.assertTrue(self.graph["policy"]["production_change_requires_permission"])
        self.assertTrue(self.graph["policy"]["destructive_actions_require_separate_confirmation"])

    def test_vague_slow_host_prioritizes_diagnosis(self):
        matches = graphcli.matching_routes(self.graph, "My laptop is suddenly slow")
        self.assertTrue(matches)
        self.assertEqual(matches[0][1]["id"], "performance")

    def test_bash_routes_to_defensive_shell(self):
        matches = graphcli.matching_routes(self.graph, "write a Bash script with ShellCheck")
        self.assertTrue(matches)
        self.assertEqual(matches[0][1]["id"], "bash-gnu-tools")

    def test_nginx_route_has_web_specialists(self):
        matches = graphcli.matching_routes(self.graph, "My Nginx site shows a 502 error")
        self.assertTrue(any(route["id"] == "web-ops" for _, route in matches))

    def test_graph_lists_every_skill(self):
        output = graphcli.diagram(self.graph)
        self.assertIn("flowchart LR", output)
        for skill in graphcli.get_skills(self.graph):
            self.assertIn('["' + skill["name"] + '"]', output)


if __name__ == "__main__":
    unittest.main()
