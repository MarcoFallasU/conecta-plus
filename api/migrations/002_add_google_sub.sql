-- Identificador estable de la cuenta de Google ("sub"). Es único; varias filas pueden
-- tenerlo vacío (cuentas anteriores o de demostración que aún no entraron con Google).
ALTER TABLE "User" ADD COLUMN "googleSub" TEXT;
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");
