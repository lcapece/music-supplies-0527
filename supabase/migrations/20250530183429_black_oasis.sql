/*
  # Add test order history data
  
  This migration adds sample order history records to show the data 
  in the OrderHistory.tsx component.
*/

-- Create test order history entries
INSERT INTO lcmd_ordhist
  (accountnumber, invoicenumber, dstamp, invoicedate, salesman, terms, model, "Description", "Qty", unitnet, payments)
VALUES
  -- Order 2: Drums
  (102, 50015, '05/15/2025', '05/15/2025', 'Johnson, Maria', 'Net 30', 'DP-SET-STD', 'Standard Drum Kit - 5pc', '1', '699.99', 'Paid'),
  (102, 50015, '05/15/2025', '05/15/2025', 'Johnson, Maria', 'Net 30', 'DRUM-STICKS', 'Oak Drum Sticks - Pair', '2', '12.50', 'Paid'),
  
  -- Order 3: Piano and accessories  
  (102, 50022, '05/17/2025', '05/17/2025', 'Smith, John', 'Net 30', 'DGP-640', 'Yamaha Digital Grand Piano', '1', '3499.99', 'Partially Paid'),
  (102, 50022, '05/17/2025', '05/17/2025', 'Smith, John', 'Net 30', 'BENCH-ADJ', 'Adjustable Piano Bench - Black', '1', '129.99', 'Partially Paid'),
  (102, 50022, '05/17/2025', '05/17/2025', 'Smith, John', 'Net 30', 'BOOK-BASICS', 'Piano Basics for Beginners', '2', '19.99', 'Partially Paid');