# GradassiTracker ⚡

**GradassiTracker** è uno strumento dedicato ai collezionisti di Pokémon TCG in Italia. Permette di monitorare i prezzi delle carte, visualizzare leaderboard basate sulle rarità e gestire il tracciamento dei prodotti sigillati.

## Caratteristiche
- 📈 **Price Tracking**: Monitoraggio dei prezzi in tempo reale tramite le API di CardTrader.
- 🏆 **Leaderboards**: Classifiche dinamiche per carte e prodotti sigillati.
- 🇮🇹 **Focus Italia**: Dati ottimizzati per il mercato italiano.
- 📱 **Design Moderno**: Interfaccia responsive e accattivante.

## Requisiti
- [Node.js](https://nodejs.org/) (versione 18 o superiore)
- Un account su [CardTrader](https://www.cardtrader.com/) per ottenere un token API.

## Installazione

1. Clona il repository:
   ```bash
   git clone https://github.com/HiImLuxifer/gradassiTracker.git
   cd gradassiTracker
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Configura le variabili d'ambiente:
   - Copia il file `.env.example` in `.env`:
     ```bash
     cp .env.example .env
     ```
   - Inserisci il tuo `CARDTRADER_API_TOKEN` nel file appena creato.

## Utilizzo

Per avviare il server di sviluppo:
```bash
   
```

Per generare la build di produzione:
```bash
npm run build
```

Per aggiornare i prezzi manualmente:
```bash
npm run update-prices
```

---
*Creato con ❤️ per la community di Pokémon TCG Italia.*
