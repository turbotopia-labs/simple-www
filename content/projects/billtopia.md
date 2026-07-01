---
title: BILLtopia
date: 2026-06-30
category: software
summary: En enkel, selvdrevet fakturerings- og kostnadssporingstjeneste for små bedrifter og frilansere.
tags: [software, finance, accounting, business, open source]
status: testing v.1.4
link: 
repository: 
draft: false
---

BILLtopia er en enkel, selvdrevet fakturerings- og kostnadssporingstjeneste for små bedrifter og frilansere. Løsningen er utviklet for virksomheter som ønsker kontroll over kunder, leverandører, fakturaer, kostnader og rapportering uten avhengighet til tredjeparts skytjenester.

Prosjektet er nå i intern testfase. Versjon 1.4 gjennomgår testing av kjernefunksjoner, datamodell, sikkerhet, PDF-generering, import/eksport, betalingsflyt og rapportering før bredere bruk. Testingen skal avdekke feil, validere arbeidsflyter og sikre at bokførte dokumenter, sikkerhetskopier og brukerroller fungerer som forventet.

Systemet bruker lokal SQLite-database og legger vekt på eierskap til egne data, sporbarhet, sikkerhet og enkel drift. Innlogging håndteres med serverlagrede sesjoner og CSRF-beskyttelse, og løsningen støtter rollene administrator, redaktør og lesetilgang. Flere virksomheter kan håndteres med separat tilgang og dataisolasjon.

BILLtopia omfatter kunde- og leverandørregister, katalog for varer og tjenester, fakturaer, kreditnotaer, kostnader, kvitteringer og vedlegg. Fakturaer kan opprettes, forhåndsvises, skrives ut og genereres som serverproduserte PDF-er. Systemet støtter fakturastatuser som utkast, sendt, betalt og forfalt, samt automatisk markering av forfalte fakturaer.

I testfasen valideres blant annet årlige fakturanummersekvenser, produktvalg i fakturalinjer, rabatter, betalingsvilkår, avrunding, blandede MVA-satser, delbetalinger, restsaldo og betalingshistorikk. PDF-funksjonene testes med BETALT-stempel, moderne helsides mal og alternative maler som Windows 98, NT Workstation og Windows CE.

Kostnadsdelen dekker registrering av kostnader og MVA, kvitteringsopplasting, dra-og-slipp for flere kvitteringer og arkivering av bilag. Eksportfunksjoner for CSV, SAF-T-relevante data og EHF 3.0 / Peppol BIS Billing inngår også i testomfanget.

Løsningen inkluderer betalingsoppfølging med KID/OCR-grunnlag, automatisk bankavstemming, bankimport, betalingspåminnelser, purringer, purregebyr, aldersfordelte utestående poster, kundesaldo og betalingsprognoser.

Det arbeides også med kvalitetssikring av søk, lagrede visninger, massehandlinger, duplisering, produktgrupper, prisvarianter, kundespesifikke priser, virksomhetsoversikt og lyst, mørkt eller systemstyrt tema.

BILLtopia skal ha versjonerte databasemigreringer, automatiserte tester, full eksport og import av kontrollsummert sikkerhetskopi, stabilt API v1 og dokumentasjon for drift, restore, sikkerhet og WCAG 2.2 AA-gjennomgang.

Målet med den interne testfasen er å gjøre BILLtopia stabil, etterprøvbar og trygg nok for praktisk bruk i små virksomheter, med særlig vekt på korrekt fakturering, sporbare korreksjoner og kontroll over egne data.