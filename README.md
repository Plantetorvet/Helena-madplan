# Helenas Glutenfri Koekken

En hjemmeside der genererer glutenfrie madplaner med indkoebsliste til danske supermarkeder.

## Funktioner
- Vaelg 1-7 dage
- Vaelg maaltider: morgenmad, frokost, madpakke, aftensmad, mellemmaltid
- Opskrifter i simpelt sprog til boern og voksne
- Interaktiv indkoebsliste (Netto, Lidl, Rema 1000)
- Ingen gluten, maelk eller soja

---

## Sadan deployer du (gratis med Netlify)

### Trin 1 — Laeg projektet paa GitHub
1. Opret en gratis konto paa [github.com](https://github.com)
2. Klik "New repository", giv det et navn (fx `helena-glutenfri`)
3. Upload alle filerne fra denne ZIP

### Trin 2 — Forbind Netlify til GitHub
1. Opret en gratis konto paa [netlify.com](https://netlify.com)
2. Klik "Add new site" -> "Import an existing project"
3. Vaelg GitHub og find dit repository
4. Build settings lades tomme (ingen build-kommando behoeves)
5. Klik "Deploy site"

### Trin 3 — Tilfoej din Anthropic API-noegle
1. Gaa til [console.anthropic.com](https://console.anthropic.com) og opret en konto
2. Gaa til "API Keys" og opret en noegle
3. I Netlify: gaa til dit site -> Site configuration -> Environment variables
4. Klik "Add a variable":
   - Key:   `ANTHROPIC_API_KEY`
   - Value: din noegle (starter med `sk-ant-...`)
5. Klik "Save" — sitet genstarter automatisk

### Trin 4 — Aaben dit site
Netlify giver dig et link som fx `https://helena-glutenfri.netlify.app`
Det kan du dele med alle!

---

## Fil-struktur
```
helena-glutenfri/
  index.html                  <- Selve hjemmesiden
  netlify.toml                <- Netlify konfiguration
  netlify/
    functions/
      claude.js               <- Backend-funktion (kalder Anthropic API)
  README.md                   <- Denne fil
```

## Kostmaessige regler (fra Allergi- og Lungeklinikken Aarhus)
Ingen: hvede, rug, byg, spelt, alm. havre, maelk, smoer, floede, ost, soja
Tilladt: ris, quinoa, boghvede, hirse, glutenfri havregryn, kartofler, majs,
         mandelmalk, kokosmalk, havremalk, koed, fisk, aeg, groentsager, noedder
