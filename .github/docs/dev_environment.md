# Ambiente de Desenvolvimento
Para manter um padrão de versão das ferramentas usadas no projeto, siga esse passo a passo:

## Instale o Git
Para verificar se o Git está instalado na sua máquina, execute:

```bash
git --version
```

Se aparecer a versão (algo como `git version 2.37.3`), ele está instalado.

Caso não esteja, acesse https://git-scm.com e baixe para o seu sistema operacional.

Para confirmar a instalação, execute o comando acima.

## Instale o NodeJS
Assim como o Git, verifique se já possui o NodeJS instalado com o comando abaixo:

```bash
node --version
```

Caso não possua instalado, acesse https://nodejs.org e baixe a versão "LTS" para o seu sistema operacional.

> Se seu sistema operacional for baseado em Linux (ex.: Ubuntu, Debian), você precisará utilizar `sudo` antes dos comandos abaixo (`sudo <comando>`).

Se a versão for diferente da apresentada no [`README.md`](../../README.md#ambiente-de-desenvolvimento), instale o pacote `n` para instalar a versão correta:

```
npm install --global n
```

Com ele instalado, instale a versão correta:

```bash
n x.x.x
```

Troque `x.x.x` pela versão informada no [`README.md`](../../README.md#ambiente-de-desenvolvimento) pro NodeJS.

## Instale o NestJS
O NestJS é um framework para construir aplicações Node.js eficientes, confiáveis e escaláveis. Verifique se já possui o NestJS instalado com o comando abaixo:

```bash
  nest --version
```
Se o comando acima não retornar uma versão ou se você deseja garantir que possui a versão mais recente do Nest CLI, instale-o globalmente utilizando o npm:

```bash
  npm install -g @nestjs/cli
```

## Instale o Docker
Docker é uma plataforma para desenvolver, enviar e executar aplicações dentro de containers.Verifique se já possui o Docker instalado com o comando abaixo:

```bash
  docker --version
```
Se o comando retornar algo como `Docker version x.y.z, build f0df350`, 
o Docker já está instalado. Caso o Docker não esteja instalado, acesse 
[Docker Desktop](https://www.docker.com/products/docker-desktop) e 
baixe o instalador correspondente ao seu sistema operacional.