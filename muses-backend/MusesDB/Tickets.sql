-- Additive tickets. Demo QR never collects payment; online confirmation requires a signed provider IPN.
IF OBJECT_ID('dbo.TicketOffers','U') IS NULL
CREATE TABLE dbo.TicketOffers (
 MuseumID INT PRIMARY KEY REFERENCES dbo.Museums(MuseumID),
 AdultPrice INT NOT NULL CHECK(AdultPrice BETWEEN 0 AND 10000000),
 ConcessionPrice INT NOT NULL CHECK(ConcessionPrice BETWEEN 0 AND 10000000),
 ChildPrice INT NOT NULL CHECK(ChildPrice BETWEEN 0 AND 10000000),
 IsEnabled BIT NOT NULL DEFAULT 0,
 ClosedWeekdays VARCHAR(20) NOT NULL DEFAULT '',
 Terms NVARCHAR(1500) NOT NULL,
 UpdatedBy INT NOT NULL REFERENCES dbo.Users(UserID),
 UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('dbo.TicketReservations','U') IS NULL
BEGIN
 CREATE TABLE dbo.TicketReservations (
 ReservationID VARCHAR(36) PRIMARY KEY,
 BookingCode VARCHAR(24) NOT NULL UNIQUE,
 RequestHash VARCHAR(64) NOT NULL,
 IsDemoPayment BIT NOT NULL DEFAULT 1,
 MuseumID INT NOT NULL REFERENCES dbo.Museums(MuseumID),
 VisitDate DATE NOT NULL,
 FullName NVARCHAR(150) NOT NULL, Email VARCHAR(255) NOT NULL,
 Adults INT NOT NULL, Concessions INT NOT NULL, Children INT NOT NULL,
 AdultPrice INT NOT NULL, ConcessionPrice INT NOT NULL, ChildPrice INT NOT NULL,
 TotalAmount INT NOT NULL CHECK(TotalAmount>=0),
 PaymentState VARCHAR(16) NOT NULL DEFAULT 'Pending' CHECK(PaymentState IN ('Pending','Paid','Failed','NotRequired')),
 PaymentTransaction VARCHAR(64) NULL,
 PaidAt DATETIME2 NULL,
 ExpiresAt DATETIME2 NOT NULL,
 Status VARCHAR(16) NOT NULL DEFAULT 'Reserved' CHECK(Status IN ('Reserved','Cancelled','CheckedIn')),
 CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT CK_Ticket_DemoPayment CHECK(IsDemoPayment=0 OR PaymentState IN ('Pending','Failed')),
 CONSTRAINT CK_Ticket_Counts CHECK(Adults>=0 AND Concessions>=0 AND Children>=0 AND Adults+Concessions+Children BETWEEN 1 AND 20)
 );
 CREATE INDEX IX_Ticket_Visit ON dbo.TicketReservations(VisitDate,MuseumID,CreatedAt);
END;
GO
-- Only synthetic museums receive illustrative prices. Real museums need Admin configuration.
IF EXISTS(SELECT 1 FROM dbo.Users WHERE Role IN ('Admin','Administrator') AND IsActive=1)
INSERT INTO dbo.TicketOffers(MuseumID,AdultPrice,ConcessionPrice,ChildPrice,IsEnabled,Terms,UpdatedBy)
SELECT m.MuseumID,40000,20000,0,1,N'Giá và đặt vé minh họa. Không có giá trị vào cửa tại bảo tàng thực tế.',
 (SELECT TOP(1) UserID FROM dbo.Users WHERE Role IN ('Admin','Administrator') AND IsActive=1 ORDER BY UserID)
FROM dbo.Museums m WHERE m.IsDemo=1 AND NOT EXISTS(SELECT 1 FROM dbo.TicketOffers t WHERE t.MuseumID=m.MuseumID);
