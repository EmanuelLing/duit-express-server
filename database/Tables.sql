
CREATE TABLE Admin (
    adminID CHAR(6) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    phoneNumber VARCHAR(15)
);


CREATE TABLE User (
    userID CHAR(6) PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    email VARCHAR(100),
    phoneNumber VARCHAR(15),
    address VARCHAR(255),
    personalImage BLOB,
    adminID CHAR(6),
    FOREIGN KEY (adminID) REFERENCES Admin(adminID)
);


CREATE TABLE Icon (
    iconID CHAR(6) PRIMARY KEY,
    image BLOB
);


CREATE TABLE Notification (
    notificationID CHAR(6) PRIMARY KEY,
    title VARCHAR(100),
    type VARCHAR(50),
    description VARCHAR(255),
    image BLOB,
    date DATE,
    time TIME,
    adminID CHAR(6),
    FOREIGN KEY (adminID) REFERENCES Admin(adminID)
);


CREATE TABLE UserNotification (
    notificationID CHAR(6),
    userID CHAR(6),
    PRIMARY KEY (notificationID, userID),
    FOREIGN KEY (notificationID) REFERENCES Notification(notificationID),
    FOREIGN KEY (userID) REFERENCES User(userID)
);


CREATE TABLE Budget (
    budgetID CHAR(6) PRIMARY KEY,
    amount DECIMAL(10, 2),
    startDate DATE,
    recurrence VARCHAR(50),
    userID CHAR(6),
    FOREIGN KEY (userID) REFERENCES User(userID)
);


CREATE TABLE BasicCategory (
    basicCategoryID CHAR(6) PRIMARY KEY,
    name VARCHAR(50),
    description VARCHAR(255),
    iconID CHAR(6),
    FOREIGN KEY (iconID) REFERENCES Icon(iconID)
);


CREATE TABLE BudgetBasicCategory (
    budgetID CHAR(6),
    basicCategoryID CHAR(6),
    amount DECIMAL(10, 2),
    PRIMARY KEY (budgetID, basicCategoryID),
    FOREIGN KEY (budgetID) REFERENCES Budget(budgetID),
    FOREIGN KEY (basicCategoryID) REFERENCES BasicCategory(basicCategoryID)
);


CREATE TABLE CustomizeCategory (
    customizeCategoryID CHAR(6) PRIMARY KEY,
    name VARCHAR(50),
    description VARCHAR(255),
    userID CHAR(6),
    iconID CHAR(6),
    FOREIGN KEY (userID) REFERENCES User(userID),
    FOREIGN KEY (iconID) REFERENCES Icon(iconID)
);


CREATE TABLE BudgetCustomizeCategory (
    budgetID CHAR(6),
    customizeCategoryID CHAR(6),
    amount DECIMAL(10, 2),
    PRIMARY KEY (budgetID, customizeCategoryID),
    FOREIGN KEY (budgetID) REFERENCES Budget(budgetID),
    FOREIGN KEY (customizeCategoryID) REFERENCES CustomizeCategory(customizeCategoryID)
);


CREATE TABLE SubCategory (
    subCategoryID CHAR(6) PRIMARY KEY,
    name VARCHAR(50),
    description VARCHAR(255),
    userID CHAR(6),
    parentCategoryID CHAR(6),
    iconID CHAR(6),
    FOREIGN KEY (userID) REFERENCES User(userID),
    FOREIGN KEY (parentCategoryID) REFERENCES SubCategory(subCategoryID),
    FOREIGN KEY (iconID) REFERENCES Icon(iconID)
);


CREATE TABLE IncomeCategory (
    incomeCategoryID CHAR(6) PRIMARY KEY,
    name VARCHAR(50),
    description VARCHAR(255),
    iconID CHAR(6),
    FOREIGN KEY (iconID) REFERENCES Icon(iconID)
);


CREATE TABLE Income (
    incomeID CHAR(6) PRIMARY KEY,
    amount DECIMAL(10, 2),
    date DATE,
    description VARCHAR(255),
    paymentType VARCHAR(50),
    userID CHAR(6),
    incomeCategoryID CHAR(6),
    FOREIGN KEY (userID) REFERENCES User(userID),
    FOREIGN KEY (incomeCategoryID) REFERENCES IncomeCategory(incomeCategoryID)
);


CREATE TABLE Expense (
    expenseID CHAR(6) PRIMARY KEY,
    amount DECIMAL(10, 2),
    date DATE,
    description VARCHAR(255),
    paymentType VARCHAR(50),
    userID CHAR(6),
    subCategoryID CHAR(6),
    FOREIGN KEY (userID) REFERENCES User(userID),
    FOREIGN KEY (subCategoryID) REFERENCES SubCategory(subCategoryID)
);

