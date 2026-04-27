from app.services.issue_service import update_sla_config


def test_sla_normalize_rules(app):
    with app.app_context():
        rules = update_sla_config(
            {
                "rules": [
                    {
                        "severity": "Critical",
                        "target_hours": -20,
                        "auto_escalate": True,
                        "escalation_delay_minutes": 999999,
                    }
                ]
            }
        )
        mapped = {rule.severity: rule for rule in rules}
        assert mapped["Critical"].target_hours >= 1
        assert mapped["Critical"].escalation_delay_minutes <= 4320
