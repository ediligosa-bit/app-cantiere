// ==========================================
// IMPORTAZIONE DEGLI STRUMENTI
// ==========================================
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ECCO LA RIGA NUOVA: Dice al server di mostrare pubblicamente i file come index.html e logo.png
app.use(express.static(__dirname));

// ==========================================
// COLLEGAMENTO AL DATABASE (PRONTO PER INTERNET)
// ==========================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:maicol@localhost:5432/cantiere_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ==========================================
// ROTTA 1: CREARE UN NUOVO RAPPORTO
// ==========================================
app.post('/salva-rapporto', async (req, res) => {
    try {
        const { dataRapporto, meteo, nomeCantiere, nomeOperaio, note, matInizio, matFine, pomInizio, pomFine, lat, lng, macchina, oreMacchina, costoGasolio, valutaGasolio, listaMateriali } = req.body;
        
        const istruzioneSQL = `
            INSERT INTO rapporti_giornalieri 
            (data_rapporto, meteo, nome_cantiere, nome_operaio, note, mattina_inizio, mattina_fine, pomeriggio_inizio, pomeriggio_fine, latitudine, longitudine, macchina_operatrice, ore_macchina, costo_gasolio, valuta_gasolio, materiali) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;
        `;
        const valori = [dataRapporto, meteo, nomeCantiere, nomeOperaio, note, matInizio, matFine, pomInizio, pomFine, lat, lng, macchina, oreMacchina, costoGasolio, valutaGasolio, listaMateriali];
        
        await pool.query(istruzioneSQL, valori);
        res.status(200).json({ messaggio: 'Rapporto salvato con successo!' });
    } catch (errore) {
        console.error("Errore salvataggio:", errore);
        res.status(500).json({ errore: 'Errore nel salvataggio.' });
    }
});

// ==========================================
// ROTTA 2: LEGGERE I RAPPORTI
// ==========================================
app.get('/lista-rapporti', async (req, res) => {
    try {
        const istruzioneSQL = `SELECT * FROM rapporti_giornalieri ORDER BY COALESCE(data_rapporto, data_creazione::DATE) DESC, data_creazione DESC;`;
        const risultato = await pool.query(istruzioneSQL);
        res.status(200).json(risultato.rows);
    } catch (errore) {
        res.status(500).json({ errore: 'Errore nella lettura.' });
    }
});

// ==========================================
// ROTTA 3: ELIMINARE UN RAPPORTO
// ==========================================
app.delete('/elimina-rapporto/:id', async (req, res) => {
    try {
        await pool.query(`DELETE FROM rapporti_giornalieri WHERE id = $1;`, [req.params.id]);
        res.status(200).json({ messaggio: 'Rapporto eliminato!' });
    } catch (errore) {
        res.status(500).json({ errore: "Errore nell'eliminazione." });
    }
});

// ==========================================
// ROTTA 4: MODIFICARE UN RAPPORTO
// ==========================================
app.put('/modifica-rapporto/:id', async (req, res) => {
    try {
        const idRapporto = req.params.id;
        const { dataRapporto, meteo, nomeCantiere, nomeOperaio, note, matInizio, matFine, pomInizio, pomFine, macchina, oreMacchina, costoGasolio, valutaGasolio, listaMateriali } = req.body; 
        
        const istruzioneSQL = `
            UPDATE rapporti_giornalieri 
            SET data_rapporto = $1, meteo = $2, nome_cantiere = $3, nome_operaio = $4, note = $5, 
                mattina_inizio = $6, mattina_fine = $7, pomeriggio_inizio = $8, pomeriggio_fine = $9,
                macchina_operatrice = $10, ore_macchina = $11, costo_gasolio = $12, valuta_gasolio = $13,
                materiali = $14
            WHERE id = $15;
        `;
        const valori = [dataRapporto, meteo, nomeCantiere, nomeOperaio, note, matInizio, matFine, pomInizio, pomFine, macchina, oreMacchina, costoGasolio, valutaGasolio, listaMateriali, idRapporto];
        
        await pool.query(istruzioneSQL, valori);
        res.status(200).json({ messaggio: 'Rapporto aggiornato!' });
    } catch (errore) {
        res.status(500).json({ errore: "Errore nella modifica." });
    }
});

// ==========================================
// ACCENSIONE DEL SERVER (PRONTA PER INTERNET)
// ==========================================
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`Server ACCESO e in ascolto sulla porta ${PORTA}...`);
});