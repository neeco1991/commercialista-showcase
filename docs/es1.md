Caso Studio · Inviato a candidati Software Developer
B-Quadro AI MVP
Un piccolo esercizio asincrono prima della call successiva.
Sommario
B-Quadro AI MVP	1
§Contesto	2
A Parte prima	4
Cosa ti chiediamo	4
Nel README, 3 bullet brevi	5
B Parte seconda	6
B1. Integrazione gestionali	6
B2. Multi-tenant	6
B3. Sicurezza	6
B4. Scalabilità	6
Bonus. Domande aperte	7
§Valutazione	7
§Logistica	8

Come anticipato in call, ti chiediamo un piccolo esercizio asincrono prima della call successiva. Lo scopo non è verificare che tu sappia codare — lo diamo per scontato — ma capire come affronti dati sporchi e come prendi decisioni di prodotto e di architettura quando il tempo è poco.
L'esercizio è composto da due parti: una Parte A pratica con un piccolo tool da costruire su un CSV in fixture, per vedere come ragioni davanti a dati reali e come traduci numeri in qualcosa di utile per chi guida un'azienda; e una Parte B di design doc su 4 domande architetturali aperte, per vedere come affronti scelte di sistema (integrazioni, multi-tenant, sicurezza, scala).
Time-box
Massimo 2 ore totali. Non sprecarci più tempo: è un test breve, non vogliamo che ci dedichi giornate. Come distribuisci le 2 ore tra le due parti lo decidi tu.

AI Usage
L'AI è ovviamente da utilizzare. Cursor, Claude Code, Copilot, ChatGPT, qualunque cosa. È il modo in cui costruiremo il prodotto vero, non un'eccezione.
§Contesto

Il prodotto in 30 secondi
Stiamo costruendo uno strumento di intelligenza finanziaria per Imprenditori e CEO di PMI italiane.
L'utente vero è chi guida l'azienda (imprenditore, CEO): vuole capire come sta andando il business, individuare anomalie, decidere dove intervenire — senza dover dipendere dal commercialista o aspettare il bilancio annuale.
I dati nascono nel gestionale contabile (tipicamente in capo allo studio commercialista). Noi li peschiamo da lì, li normalizziamo e li trasformiamo in insight comprensibili da chi sta in azienda, non in studio.
Il commercialista entra come canale di distribuzione / GTM: spinge il prodotto ai propri clienti, lo configura, ci aggiunge valore consulenziale. Anche lui beneficia della stessa vista, ma non è il primary user.
Il problema vero del prodotto sta nei dati: estrarli da gestionali eterogenei, normalizzarli, trattarli con la cura che richiedono dati fiscali sensibili, e farne uscire qualcosa che un imprenditore / CEO capisca in 30 secondi.


A Parte prima
Mini-tool per imprenditore / CEO
In Piano_dei_Conti.csv trovi un export realistico (sporco) tipo quello che esce da un gestionale italiano: contiene saldi contabili mensili di un esempio di cliente PMI di uno studio commercialista.
Aspettati: descrizioni inconsistenti per lo stesso conto, codici contabili a profondità variabile, righe di totalizzatori da scartare, date in formati misti, importi in formato italiano (1.234,56), encoding e righe non sempre puliti. È normale, è il punto di partenza.
Cosa ti chiediamo
Mettiti nei panni di un imprenditore o di un CEO che apre questi dati e vuole capire come sta andando la sua azienda.
Costruisci un piccolo strumento che, partendo da quel CSV, dia all'utente business un insight utile e che con una pivot di Excel non potrebbe ottenere altrettanto bene.
Linguaggio, framework, modalità di output: liberi. Output può essere uno script CLI, un notebook, una mini-app web, una dashboard — quello che rende il valore visibile.

Nel README, 3 bullet brevi
Cosa hai costruito, e perché secondo te è utile per un imprenditore / CEO che apre il tool
Cosa hai notato nei dati
Se avessi 10 ore invece di 1, cosa faresti in più o di diverso
Consegna come ti è più rapido: repo Git pubblico/privato, gist, zip via email.



B Parte seconda

Design doc
Risposte sintetiche a queste quattro domande.
B1. Integrazione gestionali
Il prodotto deve attingere dati da Zucchetti Ago Infinity e TeamSystem, i due gestionali principali usati dagli studi italiani. Come lo affronti?
B2. Multi-tenant
L'imprenditore/CEO della PMI vede solo i dati della propria azienda. Il commercialista che fa da canale vede tutti i suoi clienti PMI. In futuro vogliamo che n studi diversi (e i rispettivi portafogli di PMI) coesistano senza vedersi fra loro. Come lo costruisci?
B3. Sicurezza
Sono dati fiscali della PMI: fatturato, debiti, fornitori, dipendenti. C'è anche il vincolo di segreto professionale del commercialista che fa da intermediario. Cosa metti in piedi?
B4. Scalabilità
Da 1 studio (5 clienti PMI) a 100 studi (qualche migliaio di clienti PMI). Quali decisioni di architettura/infra prendi adesso e quali rimandi?

Bonus. Domande aperte
Se avessi più tempo per questo esercizio, su cosa ti saresti soffermato/a?
Quali altre domande architetturali avremmo dovuto chiederti? 
Quali feature di prodotto aggiungeresti?
§Valutazione
Cosa valutiamo
Ci interessa di più come pensi che cosa produci. Una risposta corta e onesta vale più di una lunga e generica.
Per la Parte A ci interessa la pulizia delle scelte e la consapevolezza dei dati.
Per la Parte B ci interessano le tue scelte di default, i trade off che vedi, i numeri concreti, e l'onestà sui gap ("questo non l'ho mai fatto, ecco come lo affronterei").
Approfondiremo le scelte insieme nella call successiva.
