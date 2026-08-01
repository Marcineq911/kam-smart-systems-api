# KAM Smart Systems API

Backend formularza bezpłatnej wyceny. Odbiera dane z witryny, sprawdza je i wysyła wiadomość przez SMTP home.pl.

## Uruchomienie lokalne

1. Skopiuj `.env.example` jako `.env` i uzupełnij hasło lokalnie.
2. Uruchom `npm install`.
3. Uruchom `npm start`.
4. Sprawdź `http://localhost:3000/health`.

Pliku `.env` nie wolno dodawać do repozytorium.

## Heroku Config Vars

Ustaw wartości z `.env.example` w `Settings → Config Vars`. Heroku automatycznie przekazuje własną wartość `PORT`, więc nie trzeba jej ustawiać.

## Endpoint

`POST /api/quote`

```json
{
  "name": "Jan Kowalski",
  "phone": "+48 530 866 355",
  "city": "Rzeszów",
  "service": "monitoring",
  "description": "Monitoring domu jednorodzinnego.",
  "callbackTime": "Jutro po 16:00",
  "consent": true,
  "website": ""
}
```
