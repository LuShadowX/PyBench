import os
import tempfile
import unittest

from pybench.mailguard import Mail, MailGuard, Rule, LinkRule, SenderRule, load_mails

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")


class MailGuardTests(unittest.TestCase):
    def setUp(self):
        self.guard = MailGuard()

    def test_parse(self):
        m = Mail("From: A <a@x.com>\nSubject: Hi\n\nbody text")
        self.assertEqual((m.sender_domain, m.subject, m.body), ("x.com", "Hi", "body text"))
        self.assertEqual(Mail("no headers here").body, "no headers here")

    def test_all_phishing_caught(self):
        reports, errors = self.guard.analyse_folder(os.path.join(DATA, "phishing"))
        self.assertEqual(len(reports), 10)
        self.assertEqual(errors, [])
        self.assertTrue(all(r.verdict == "phishing" for r in reports))
        self.assertEqual(reports, sorted(reports, reverse=True))

    def test_safe_mails_pass(self):
        reports, _ = self.guard.analyse_folder(os.path.join(DATA, "safe"))
        self.assertTrue(all(r.verdict == "looks safe" for r in reports))

    def test_rules(self):
        m = Mail("From: PayPal <service@paypa1-help.com>\nSubject: hi\n\nGo to http://192.168.4.1/login now")
        found = " ".join(repr(f) for f in LinkRule().check(m) + SenderRule().check(m))
        self.assertIn("bare IP", found)
        self.assertIn("look-alike", found)

    def test_custom_rule_and_hiding(self):
        class ShoutRule(Rule):
            name = "all caps subject"

            def check(self, mail):
                return [self.hit("shouting")] if mail.subject.isupper() else []

        guard = MailGuard([ShoutRule()])
        self.assertEqual(guard.analyse(Mail("Subject: WIN NOW\n\nx")).score, 10)
        self.assertFalse(hasattr(guard, "__rules"))
        self.assertEqual(guard.rules, ["all caps subject"])

    def test_common_words_and_pickle(self):
        top = dict(MailGuard.common_words(load_mails(os.path.join(DATA, "phishing")), 5))
        self.assertIn("refund", top)
        reports, _ = self.guard.analyse_folder(os.path.join(DATA, "phishing"))
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "r.pkl")
            MailGuard.save(reports, path)
            self.assertEqual(len(MailGuard.load(path)), 10)
            self.assertEqual(MailGuard.load(os.path.join(d, "none.pkl")), [])


if __name__ == "__main__":
    unittest.main()
