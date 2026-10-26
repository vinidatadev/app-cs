# Fotos de seed

As imagens desta pasta não são versionadas (dados pessoais). Elas são usadas pelo backend apenas no startup para popular o MinIO.

Coloque aqui a estrutura:

```text
seed-assets/
└── imagens/
    └── perfil/
```

O backend envia os arquivos para o bucket correspondente sem sobrescrever objetos já existentes.

Se você já tem um MinIO de origem, o caminho recomendado é copiar os buckets direto com `mc mirror` (veja `docs/09-BACKUP-RESTORE.md`).
