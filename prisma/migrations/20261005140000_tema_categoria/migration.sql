-- La categoría de cada tema de la sobremesa. Nula en lo que ya estaba escrito: se lee como
-- "Cualquiera" y la casa las puede ir acomodando desde el panel sin que nada se rompa.
ALTER TABLE "Tema" ADD COLUMN "categoria" TEXT;

-- Para filtrar por categoría sin recorrer todo: el índice que ya había ordena por otra cosa.
CREATE INDEX "Tema_categoria_lastAt_idx" ON "Tema"("categoria", "lastAt");
