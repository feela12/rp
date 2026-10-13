-- Run this script in the SQL Server database configured in your .env file.
IF OBJECT_ID(N'dbo.Products', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.Products (
    Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Products PRIMARY KEY,
    Name NVARCHAR(150) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Price DECIMAL(10, 2) NOT NULL,
    ImagePath NVARCHAR(300) NOT NULL,
    PagePath NVARCHAR(150) NOT NULL,
    UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT SYSUTCDATETIME()
  );
END;

IF NOT EXISTS (SELECT 1 FROM dbo.Products WHERE PagePath = N'product8.html')
BEGIN
  INSERT INTO dbo.Products (Name, Description, Price, ImagePath, PagePath)
  VALUES (
    N'GRADUATION CD',
    N'Graduation CD is a unique music album that combines the raw energy of punk rock with the introspective depth of indie music. Featuring a blend of aggressive guitar riffs, catchy melodies, and thought-provoking lyrics, this album captures the essence of youthful rebellion and self-discovery. Each track takes listeners on a journey through themes of identity, societal expectations, and the search for meaning in a chaotic world. With its dynamic sound and emotionally charged performances, Graduation CD is a must-listen for fans of both genres and anyone looking for music that resonates on a deeper level.',
    15.00,
    N'../images/products/gradrek.png',
    N'product8.html'
  );
END;
