# Setup da newsletter com Firebase

## O que esta versão faz
- Página `newsletter.html`: cadastra inscritos.
- Página `admin-newsletter.html`: painel admin com login, busca, exportação CSV e exclusão.
- Banco: Cloud Firestore.
- Login do admin: Firebase Authentication com e-mail e senha.

## 1) Criar projeto e registrar app web
No console do Firebase, crie um projeto, adicione um app web e copie o objeto de configuração para `assets/js/config.js`.

## 2) Preencher `assets/js/config.js`
Preencha:
- `firebase.apiKey`
- `firebase.authDomain`
- `firebase.projectId`
- `firebase.storageBucket`
- `firebase.messagingSenderId`
- `firebase.appId`
- `admin.allowedEmail`

## 3) Ativar autenticação
No Firebase Console:
- Authentication
- Sign-in method
- Ative `Email/Password`
- Crie o usuário administrador com o mesmo e-mail que você colocou em `admin.allowedEmail`

## 4) Criar o banco
No Firebase Console:
- Firestore Database
- Create database
- Escolha o modo de produção
- Depois publique as regras do arquivo `firebase/firestore.rules`
- Troque `SEU_EMAIL_ADMIN_AQUI` pelo seu e-mail admin antes de publicar

## 5) Publicar as regras
Você pode colar as regras manualmente no console do Firestore ou usar Firebase CLI.

## 6) Publicar o site
Pode continuar no GitHub Pages normalmente.
O site usa Firebase só para Auth + Firestore.

## Observações
- O cadastro público grava `email`, `source`, `status` e `createdAt`.
- O painel admin lê em tempo real usando Firestore.
- Se o Firebase não estiver configurado, o site usa fallback local no navegador para não quebrar.
