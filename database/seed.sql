BEGIN;

INSERT INTO usuarios (nombre, saldo_mensual, presupuesto_diario)
VALUES ('Usuario de demostración', 100.00, 25.00);

INSERT INTO alimentos (nombre, categoria, precio, stock)
VALUES
    ('Menú Ejecutivo (Pollo)', 'Fuerte', 5.50, 12),
    ('Pasta Alfredo', 'Fuerte', 6.25, 8),
    ('Carne a la plancha', 'Fuerte', 7.00, 6),
    ('Ensalada fresca', 'Entrada', 2.50, 10),
    ('Sopa de verduras', 'Entrada', 2.00, 5),
    ('Jugo natural', 'Bebida', 1.50, 15),
    ('Agua embotellada', 'Bebida', 1.00, 20),
    ('Flan de vainilla', 'Postre', 2.25, 0);

COMMIT;
