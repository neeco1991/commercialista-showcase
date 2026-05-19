# Parte B - Design doc

## B1. Integrazione gestionali

Affronterei ogni nuovo provider di dati con un connector separato che porti il dato nel formato più utile alla dashboard.
La parte importante è non legare il prodotto al formato di un gestionale. Ogni gestionale ha un adapter, ma il resto del sistema parla solo con il modello canonico.
Tecnicamente cron jobs.

## B2. Multi-tenant

Un unico deploy, un unico DB, autorizzazione forte lato backend/database (es. OpenFGA)

## B3. Sicurezza

MVP: RLS, TLS ecryption, compliance

Dopo: MFA, dependency scanning

## B4. Scalabilità

MVP: Client deployato su Vercel, Jobs su un altro servizio gestito

Dopo: AWS, Kubernetes
