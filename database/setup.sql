-- Spusť celý skript v SQL Server Management Studio (SSMS)
-- po připojení k databázi, kterou používá web.

IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Products (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    ImagePath NVARCHAR(300) NOT NULL,
    PagePath NVARCHAR(150) NOT NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Products_PagePath UNIQUE (PagePath)
  );
END;

IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Users (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(10) NOT NULL CONSTRAINT DF_Users_Role DEFAULT N'user',
    CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT UQ_Users_Username UNIQUE (Username),
    CONSTRAINT CK_Users_Role CHECK (Role IN (N'user', N'admin'))
  );
END;

-- Vloží produkty, které v tabulce ještě nejsou. Existující záznamy nemění.
INSERT INTO dbo.Products (Name, Description, Price, ImagePath, PagePath)
SELECT source.Name, source.Description, source.Price, source.ImagePath, source.PagePath
FROM (VALUES
  (N'A GREAT CHAOS CHAIN - REPLICA', N'Metalový přívěsek inspirovaný moderním rage stylem. Výrazný tvar a leštěný povrch dodají outfitu temný, futuristický vzhled.', 800.00, N'../images/products/3chaos.png', N'product1.html'),
  (N'RICK OWENS SS20 BRUTALIST CHAIN', N'Výrazný brutalistický řetěz inspirovaný módou Rick Owens. Robustní design pro odvážný alternativní styl.', 1200.00, N'../images/products/chain1.jpeg', N'product2.html'),
  (N'RICK OWENS DRKSHDW', N'Kousek inspirovaný kolekcí Rick Owens DRKSHDW, charakteristickou tmavou paletou a avantgardním vzhledem.', 2500.00, N'../images/products/DRK.png', N'product3.html'),
  (N'MAISON MARGIELA FUTURE', N'Výrazný módní kousek inspirovaný futuristickým stylem Maison Margiela.', 999.00, N'../images/products/margiela1.png', N'product4.html'),
  (N'YZY WET TANK TOP', N'Tílko YZY WET v minimalistickém stylu. Lehký výrazný kousek inspirovaný kolekcí Yeezy.', 20.00, N'../images/products/yeezywet1.png', N'product5.html'),
  (N'XO PENDANT - THE WEEKND REPLICA', N'Přívěsek XO inspirovaný estetikou The Weeknd. Výrazný doplněk pro fanoušky jeho hudby a stylu.', 500.00, N'../images/products/XOprod.png', N'product6.html'),
  (N'GRADUATION - ACTION FIGURE', N'Sběratelská figurka inspirovaná výtvarným světem alba Graduation. Dárek pro fanoušky a sběratele.', 200.00, N'../images/products/XOprod.png', N'product7.html'),
  (N'GRADUATION CD', N'Graduation CD is a unique music album that combines the raw energy of punk rock with the introspective depth of indie music. Featuring a blend of aggressive guitar riffs, catchy melodies, and thought-provoking lyrics, this album captures the essence of youthful rebellion and self-discovery. Each track takes listeners on a journey through themes of identity, societal expectations, and the search for meaning in a chaotic world. With its dynamic sound and emotionally charged performances, Graduation CD is a must-listen for fans of both genres and anyone looking for music that resonates on a deeper level.', 15.00, N'../images/products/gradrek.png', N'product8.html'),
  (N'BULLY CD', N'BULLY CD is a contemporary music album blending hip-hop, electronic, and experimental sounds. Its tracks explore identity, resilience, and social commentary through expressive lyrics and detailed production.', 15.00, N'../images/products/bully1.png', N'product9.html'),
  (N'MICHAEL JACKSON - THRILLER CD', N'Thriller CD by Michael Jackson features an iconic mix of pop, funk, and rock, with memorable songs and detailed production.', 15.00, N'../images/products/mj1.png', N'product10.html')
) AS source (Name, Description, Price, ImagePath, PagePath)
WHERE NOT EXISTS (
  SELECT 1 FROM dbo.Products AS existing WHERE existing.PagePath = source.PagePath
);

-- Zobraz vložené produkty pro kontrolu.
SELECT Id, Name, Price, ImagePath, PagePath
FROM dbo.Products
ORDER BY TRY_CONVERT(INT, REPLACE(REPLACE(PagePath, N'product', N''), N'.html', N''));
