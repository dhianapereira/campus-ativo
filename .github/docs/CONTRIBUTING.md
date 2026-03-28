# Como contribuir

> Siga os passos abaixo para contribuir com código ou sugestões de melhorias/correções no projeto.

## Conteúdo:

- [Como contribuir](#como-contribuir)
  - [Conteúdo:](#conteúdo)
  - [1. Pré-Requisitos](#1-pré-requisitos)
  - [2. Siga os passos do Guia de Instalação](#2-siga-os-passos-do-guia-de-instalação)
  - [3. Antes de tudo, sincronize com o repositório remoto](#3-antes-de-tudo-sincronize-com-o-repositório-remoto)
  - [4. Inicie a _branch_ de funcionalidade](#4-inicie-a-branch-de-funcionalidade)
  - [5. Realize as alterações necessárias](#5-realize-as-alterações-necessárias)
  - [6. Registre as alterações realizadas](#6-registre-as-alterações-realizadas)
    - [Fiz algo de errado... E agora?](#fiz-algo-de-errado-e-agora)
  - [7. Enviar as modificações para análise](#7-enviar-as-modificações-para-análise)
  - [8. Abra um _Pull Request_](#8-abra-um-pull-request)
  - [9. O PR foi aprovado?](#9-o-pr-foi-aprovado)
  - [Sugerir melhorias ou correções](#sugerir-melhorias-ou-correções)

---

## 1. Pré-Requisitos

- [Git](https://git-scm.com/downloads);
- [NodeJS](https://nodejs.org/en/);
- [NestJS](https://nestjs.com/);
- [Docker](https://www.docker.com/);
- Editor de código (ex.: [Visual Studio Code](https://code.visualstudio.com/Download)).

## 2. Siga os passos do [Guia de Instalação](../../README.md#guia-de-instalação)

Com isso, você terá tudo o que é necessário para executar a aplicação.

Após seguir todos os passos do guia, execute as seguintes instruções:

## 3. Antes de tudo, sincronize com o repositório remoto

Para evitar conflitos com o código principal que está no repositório remoto do GitHub, **SEMPRE** execute o comando abaixo antes de realizar qualquer modificação:

Se você estiver na branch principal (`main`), rode o comando:

```bash
git checkout develop
```

Após entrar na branch de desenvolvimento (`develop`), execute:

```bash
git pull origin develop
```

## 4. Inicie a _branch_ de funcionalidade

> Não sabe o que é uma _branch_? Não tem problema, [clique aqui](https://git-scm.com/book/pt-br/v2/Branches-no-Git-Branches-em-poucas-palavras) para entender.

```bash
git checkout -b feature/<nome-da-branch>

# feature é apenas um prefixo que adotamos para as nossas branches.
# Esse prefixo não é padrão do git.
# Troque <nome-da-branch> pelo nome da funcionalidade que você implementará (ex.: create-login-route)
```

## 5. Realize as alterações necessárias

Agora você pode modificar os arquivos existentes no projeto ou até criar novos arquivos e pastas, caso seja necessário.

## 6. Registre as alterações realizadas

Após alterar o código, adicione as alterações ao Git com os seguintes comandos:

```bash
git add .

# "." vai adicionar todos os arquivos de uma vez
# Caso queira adicionar um arquivo específico,
# troque "." pelo endereço do arquivo (ex.: "git add src/services/auth.ts")
```

```bash
git commit -m "tipo: mensagem"
```

Verifique no arquivo [`conventions.md`](./conventions.md) o padrão de mensagens de _commit_ que você deve seguir.

### Fiz algo de errado... E agora?

Se você chegou em algum ponto que não sabe o que fazer, dá uma olhada nesse artigo: https://ohshitgit.com/

## 7. Enviar as modificações para análise

Após fazer e registrar as alterações, é necessário enviá-las para o repositório remoto. Assim, todos poderão ver a sua contribuição.

Para enviar suas modificações, execute o seguinte comando:

```bash
git push origin feature/<nome-da-branch>

# Troque <nome-da-branch> pelo nome da branch que você criou no passo 4 deste guia
```

## 8. Abra um _Pull Request_

> Não sabe o que é um _Pull Request_? [Clique aqui](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests) para entender.
> Você pode seguir [este guia](https://docs.github.com/pt/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request) para criar um _pull request_.

Na criação do PR, siga o padrão abaixo na definição do título:

```
tipo: mensagem
```

Verifique no arquivo [`conventions.md`](./conventions.md) o tipo que você deve adicionar.

Após a criação do PR, espere alguém analisar o seu código e indicar o que deve ser feito.

Caso seja exigida alguma alteração, você pode realizar as correções seguindo do [passo 5](#5-realize-as-alterações-necessárias) deste guia em diante.

## 9. O PR foi aprovado?

> Só siga esse passo se tiver certeza de que o PR foi aprovado. Caso tenha dúvida, pergunte.
> Se o PR foi aprovado, você pode enviar as alterações realizadas para a _branch_ de desenvolvimento (develop) através do botão de `merge` do seu PR. Após o merge, você pode excluir a _branch_ que criou no [passo 4](#4-inicie-a-branch-de-funcionalidade).

## Sugerir melhorias ou correções

Caso você ainda não sinta segurança em contribuir com código ou encontrou um problema/situação de melhoria e quer reportar, crie uma [_issue_](https://github.com/dhianapereira/campus-ativo/issues/new).

Utilize [este guia](https://docs.github.com/pt/issues/tracking-your-work-with-issues/creating-an-issue) para reportar um problema ou indicar uma melhoria através de _issues_.

---

Surgiu alguma dúvida? Entre em contato com um dos membros do repositório :)
