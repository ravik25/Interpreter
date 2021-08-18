# Interpreter

## An application where a user can translate text to any particular language of their choice.There is also an implementation of cache using Redis which saves time by providing results that were stored earlier instead of calling API's again.

## Technologies
* Node.js
* Express
* hbs Templating
* Redis
### What's and How's
* User can translate text to any of his desired language.
* Used vitalets/google-translate-api for translating text and iso-639-1 for detecting language code.
* If a user translates a text into Kannada, he is likely to also translate the same text to Hindi.Therefore, in order to avoid repeated hits to the translation API we have divided languages into categories and Pre-cached results.
* Pre-Caching is being done in such a way that if user enters a language then same text for other languages of same region also gets cached anticipating that user might also want to translate in some other language

### Installation
Install the dependencies
```sh
$ npm install
```
Run app

```sh
$ node index
```
