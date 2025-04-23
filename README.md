# IFAL - Campus Arapiraca

Caso queira contribuir com novos componentes, melhorias e/ou correções no projeto, siga os passos do arquivo [CONTRIBUTING.md](./.github/docs/CONTRIBUTING.md) e dá uma conferida no nosso [Fluxo de Trabalho](./.github/docs/workflow.md).

## Ambiente de Desenvolvimento
Para que todos tenham o ambiente de desenvolvimento o mais parecido possível e evitar problemas, certifique-se de ter as ferramentas acima com as seguintes versões:

| Ferramenta | Versão |
| --- | --- |
| Git | A mais recente |
| NodeJS | v22.14.0 |
| NestJS | v10.4.4 |
| Docker | v28.0.4 |

Para instalar as devidas versões, siga o passo a passo do arquivo [`dev_environment.md`](./.github/docs/dev_environment.md).

## Guia de Instalação
> Com as ferramentas devidamente instaladas, execute os comandos abaixo

### **1. Clonar repositório**
```bash
git clone https://github.com/campusativo/ifal-arapiraca-backend.git
```

### **2. Entrar na pasta do projeto**
```bash
cd ifal-arapiraca-backend
```

### **3. Instalar as dependências**
```bash
npm install
```

### **3. Executar o docker compose**
```bash
docker compose up -d
```
Para verificar se o docker está rodando, basta listar os containers com o comando:
```bash
docker ps
```
Se quiser parar de rodar o docker utilize o comando abaixo:
```bash
docker compose stop
```

### **3. Executar a aplicação**
```bash
npm run start:dev
```