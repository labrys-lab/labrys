import type { ScenarioMeta } from "@/types";

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "kerberoasting",
    name: "Kerberoasting",
    difficulty: "Medium",
    estimatedMinutes: 30,
    description:
      "Extract service account tickets from Kerberos and crack them offline to obtain plaintext passwords.",
    tags: ["Active Directory", "Kerberos"],
  },
  {
    id: "pass-the-hash",
    name: "Pass the Hash",
    difficulty: "Medium",
    estimatedMinutes: 25,
    description:
      "Use captured NTLM password hashes to authenticate to remote services without knowing the plaintext password.",
    tags: ["Active Directory", "NTLM"],
  },
  {
    id: "dcsync",
    name: "DCSync",
    difficulty: "Hard",
    estimatedMinutes: 40,
    description:
      "Impersonate a domain controller to replicate user credentials, including NTLM hashes, from Active Directory.",
    tags: ["Active Directory", "Mimikatz"],
  },
  {
    id: "brute-force",
    name: "Brute Force",
    difficulty: "Easy",
    estimatedMinutes: 20,
    description:
      "Systematically try username and password combinations to gain unauthorized access to a target service.",
    tags: ["Authentication", "Password Attack"],
  },
  {
    id: "port-scan",
    name: "Port Scan",
    difficulty: "Easy",
    estimatedMinutes: 15,
    description:
      "Enumerate open ports and services on target hosts to map the attack surface of the lab network.",
    tags: ["Reconnaissance", "Nmap"],
  },
  {
    id: "sqli-lfi",
    name: "SQLi / LFI",
    difficulty: "Medium",
    estimatedMinutes: 35,
    description:
      "Exploit SQL injection and local file inclusion vulnerabilities in a web application to extract sensitive data.",
    tags: ["Web", "Injection"],
  },
];
