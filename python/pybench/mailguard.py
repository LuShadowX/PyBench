# MailGuard: reads e-mails from text files and scores how phishy they look.
# This is the mini project for the course, it uses something from every unit:
# strings and dicts (III), functions (IV), classes and inheritance (V),
# files, pickle, exceptions and regular expressions (VI).

import os
import pickle
import re
from collections import Counter

from .unit6_files import PATTERNS

STOPWORDS = set("""
a an the and or but if of to in on at by for with from as is are was were be been being this that these those
it its you your yours we our us i me my he she they them their his her not no do does did have has had will would
can could should may might must shall just so than then there here what which who whom when where why how all any http https www com
each more most other some such only own same too very s t now please dear hi hello regards team thank thanks
""".split())


class Mail:
    HEADER = re.compile(r"^(From|To|Subject|Date|Reply-To):\s*(.*)$", re.M)

    def __init__(self, text, name="mail"):
        self.name = name
        self.raw = text
        head, _, body = text.partition("\n\n")
        self.headers = {k.lower(): v.strip() for k, v in self.HEADER.findall(head)}
        self.body = body.strip() if self.headers else text.strip()

    @classmethod
    def from_file(cls, path):
        with open(path, encoding="utf-8", errors="replace") as f:
            return cls(f.read(), os.path.basename(path))

    @property
    def sender(self):
        return self.headers.get("from", "")

    @property
    def subject(self):
        return self.headers.get("subject", "")

    @property
    def sender_domain(self):
        m = re.search(r"@([\w.-]+)", self.sender)
        return m.group(1).lower() if m else ""

    @property
    def urls(self):
        return re.findall(PATTERNS["url"], self.raw)

    def words(self):
        return [w for w in re.findall(r"[a-z']+", (self.subject + " " + self.body).lower()) if len(w) > 2 and w not in STOPWORDS]

    def __repr__(self):
        return f"Mail({self.name!r}, {self.subject[:30]!r})"


class Finding:
    def __init__(self, rule, points, detail):
        self.rule, self.points, self.detail = rule, points, detail

    def __repr__(self):
        return f"+{self.points} {self.rule}: {self.detail}"


class Rule:
    """Base class. Each rule overrides check() and returns a list of Findings."""
    name = "rule"
    weight = 10

    def check(self, mail):
        raise NotImplementedError

    def hit(self, detail, points=None):
        return Finding(self.name, self.weight if points is None else points, detail)


class UrgencyRule(Rule):
    name = "urgent / threatening language"
    weight = 8
    WORDS = re.compile(r"\b(urgent(?:ly)?|immediately|within \d+ hours|suspend(?:ed)?|blocked|verify now|final (?:notice|warning)|expire[sd]?|act now|last chance|deactivat\w+)\b", re.I)

    def check(self, mail):
        found = sorted({m.group().lower() for m in self.WORDS.finditer(mail.subject + " " + mail.body)})
        return [self.hit(f"'{w}'") for w in found[:3]]


class CredentialRule(Rule):
    name = "asks for private details"
    weight = 15
    WORDS = re.compile(r"\b(password|otp|pin|cvv|card number|bank details|login details|aadhaar|pan card|kyc|credentials)\b", re.I)

    def check(self, mail):
        found = sorted({m.group().lower() for m in self.WORDS.finditer(mail.body)})
        return [self.hit(f"mentions {', '.join(found)}", self.weight + 5 * (len(found) - 1))] if found else []


class LinkRule(Rule):
    name = "suspicious link"
    weight = 12
    SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly", "is.gd")

    def check(self, mail):
        findings = []
        for url in mail.urls:
            host = re.sub(r"^https?://", "", url).split("/")[0].lower()
            if re.fullmatch(PATTERNS["IPv4 address"], host.split(":")[0]):
                findings.append(self.hit(f"link to a bare IP address {host}", 20))
            elif host.endswith(self.SHORTENERS):
                findings.append(self.hit(f"shortened link hides the real site ({host})"))
            elif "@" in url:
                findings.append(self.hit("'@' inside a URL, the part before it is ignored by the browser", 18))
            elif url.startswith("http://"):
                findings.append(self.hit(f"not encrypted (http) {host}", 6))
            if host.count("-") >= 2 or re.search(r"(login|secure|verify|update|account)[\w-]*\.", host):
                findings.append(self.hit(f"domain made to look official ({host})", 10))
        return findings


class SenderRule(Rule):
    name = "sender does not match"
    weight = 14
    BRANDS = {"sbi": "sbi.co.in", "paypal": "paypal.com", "amazon": "amazon.in", "netflix": "netflix.com", "microsoft": "microsoft.com",
              "lpu": "lpu.co.in", "hdfc": "hdfcbank.com", "dhl": "dhl.com", "income tax": "incometax.gov.in", "google": "google.com"}
    FREE = ("gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "rediffmail.com")

    def check(self, mail):
        findings = []
        text = (mail.sender + " " + mail.subject).lower()
        domain = mail.sender_domain
        for brand, real in self.BRANDS.items():
            if brand in text and domain and not domain.endswith(real):
                findings.append(self.hit(f"claims to be {brand.upper()} but sent from {domain}"))
                break
        if re.search(r"[01]", domain.split(".")[0]) and re.search(r"[a-z]", domain):
            findings.append(self.hit(f"look-alike characters in {domain} (0 for o, 1 for l)", 12))
        reply = mail.headers.get("reply-to", "")
        if reply and domain and domain not in reply.lower():
            findings.append(self.hit(f"replies go to a different address ({reply})", 10))
        if domain in self.FREE and re.search(r"\b(bank|support|team|department|official)\b", text):
            findings.append(self.hit(f"'official' mail from a free {domain} account", 8))
        return findings


class MoneyRule(Rule):
    name = "too good to be true"
    weight = 10
    WORDS = re.compile(r"\b(lottery|winner|won|prize|refund|cashback|gift card|claim|reward|lucky|selected|bitcoin|crypto|double your)\b", re.I)

    def check(self, mail):
        found = sorted({m.group().lower() for m in self.WORDS.finditer(mail.subject + " " + mail.body)})
        money = re.findall(PATTERNS["price in rupees"] + r"|\$\s?\d[\d,]*", mail.body)
        out = [self.hit(f"bait words: {', '.join(found[:4])}")] if found else []
        if money and found:
            out.append(self.hit(f"amount dangled: {money[0]}", 6))
        return out


class AttachmentRule(Rule):
    name = "risky attachment"
    weight = 16

    def check(self, mail):
        files = re.findall(r"\b[\w-]+\.(exe|scr|zip|rar|js|bat|docm|xlsm|iso|apk)\b", mail.raw, re.I)
        return [self.hit(f"asks to open a .{ext.lower()} file") for ext in sorted(set(files))]


class Report:
    def __init__(self, mail, findings):
        self.mail = mail.name
        self.subject = mail.subject
        self.sender = mail.sender
        self.findings = findings
        self.score = min(100, sum(f.points for f in findings))

    @property
    def verdict(self):
        if self.score >= 50:
            return "phishing"
        if self.score >= 20:
            return "suspicious"
        return "looks safe"

    def __lt__(self, other):
        return self.score < other.score

    def __repr__(self):
        return f"{self.mail}: {self.score} ({self.verdict})"


class MailGuard:
    def __init__(self, rules=None):
        self.__rules = list(rules) if rules else [UrgencyRule(), CredentialRule(), LinkRule(), SenderRule(), MoneyRule(), AttachmentRule()]

    @property
    def rules(self):
        return [r.name for r in self.__rules]

    def analyse(self, mail):
        findings = []
        for rule in self.__rules:
            findings.extend(rule.check(mail))
        return Report(mail, findings)

    def analyse_folder(self, folder):
        reports, errors = [], []
        for name in sorted(os.listdir(folder)):
            if not name.endswith((".txt", ".eml")):
                continue
            try:
                reports.append(self.analyse(Mail.from_file(os.path.join(folder, name))))
            except (OSError, UnicodeDecodeError) as err:
                errors.append(f"{name}: {err}")
        return sorted(reports, reverse=True), errors

    @staticmethod
    def common_words(mails, n=10):
        counter = Counter()
        for mail in mails:
            counter.update(mail.words())
        return counter.most_common(n)

    @staticmethod
    def save(reports, path):
        with open(path, "wb") as f:
            pickle.dump([(r.mail, r.score, r.verdict, [repr(x) for x in r.findings]) for r in reports], f)

    @staticmethod
    def load(path):
        try:
            with open(path, "rb") as f:
                return pickle.load(f)
        except FileNotFoundError:
            return []


def load_mails(folder):
    return [Mail.from_file(os.path.join(folder, n)) for n in sorted(os.listdir(folder)) if n.endswith((".txt", ".eml"))]


def main(folder=None):
    folder = folder or os.path.join(os.path.dirname(__file__), "..", "data", "phishing")
    guard = MailGuard()
    reports, errors = guard.analyse_folder(folder)
    print(f"MailGuard checked {len(reports)} mails with {len(guard.rules)} rules\n")
    for r in reports:
        print(f"{r.score:3}  {r.verdict:<11} {r.mail:<24} {r.subject[:45]}")
    for e in errors:
        print("skipped", e)
    print("\nMost common words:")
    for word, count in guard.common_words(load_mails(folder)):
        print(f"  {word:<12} {count}")


if __name__ == "__main__":
    main()
