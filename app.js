document.addEventListener("DOMContentLoaded", function() {
  const addExpenseButton = document.getElementById("addExpenseButton");
  const expenseDescription = document.getElementById("expenseDescription");
  const expenseAmount = document.getElementById("expenseAmount");
  const categorySelect = document.getElementById("categorySelect");
  const units = document.getElementById("units");
  const unitName = document.getElementById("unitName");
  const pricePerUnit = document.getElementById("pricePerUnit");
  const expenseTableBody = document.getElementById("expenseTable").getElementsByTagName("tbody")[0];
  const categoryTableBody = document.getElementById("categoryWiseTable").getElementsByTagName("tbody")[0];
  const expenseComment = document.getElementById("expenseComment");

  const addCategoryButton = document.getElementById("addCategoryButton");
  const newCategoryInput = document.getElementById("newCategoryInput");
  const deleteCategorySelect = document.getElementById("deleteCategorySelect");

  const exportDataButton = document.getElementById("exportDataButton");
  const importDataInput = document.getElementById("importDataInput");
  const exportCsvButton = document.getElementById("exportCsvButton");

  let sortColumn = ''; 
  let sortDirection = 'asc'; 
  let selectedCategory = ''; 

  let categoryFilterVisible = false; 

  // Define editable columns by index

  const editableColumns = {
    description: 0,
    amount: 1,
    units: 3,
    unitName: 4,
    pricePerUnit: 5,
    comment: 6,
  };

  // Load categories and expenses from localStorage
  function loadData() {
    const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  
    // Populate category select
    if (categorySelect) {
      categorySelect.innerHTML = '';
      categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
      });
    }

    // Populate delete category select
    if (deleteCategorySelect) {
      deleteCategorySelect.innerHTML = `<option value="">Select Category to Delete</option>`;
      categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        deleteCategorySelect.appendChild(option);
      });
    }

    // Populate expense table
    if (expenseTableBody) {
      expenseTableBody.innerHTML = '';
      let totalAmount = 0;

      // Apply category filter if necessary
      const filteredExpenses = selectedCategory
        ? expenses.filter(expense => expense.category === selectedCategory)
        : expenses;

      // Sort expenses based on the current sort column and direction
      const sortedExpenses = filteredExpenses.sort((a, b) => {
        if (!sortColumn) return 0;

        const valueA = a[sortColumn];
        const valueB = b[sortColumn];

        if (sortDirection === 'asc') {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
      });


      sortedExpenses.forEach((expense, index) => {

              // Automatically calculate amount if both pricePerUnit and units are not blank
      if (expense.pricePerUnit && expense.units && !isNaN(expense.pricePerUnit) && !isNaN(expense.units)) {
        expense.amount = expense.pricePerUnit * expense.units;
      }

      // Ensure amount is a number or blank (for manual input)
      if (isNaN(expense.amount)) {
        expense.amount = '';
      }
        const row = expenseTableBody.insertRow();
        row.setAttribute("data-index", index);
        row.innerHTML = `
        <td>${expense.description}</td>
        <td class="amount-cell">${expense.amount.toFixed(2)}</td>
        <td>${expense.category}</td>
        <td class="editable units-cell">${expense.units}</td>
        <td>${expense.unitName}</td>
        <td class="editable price-cell">${expense.pricePerUnit || ''}</td>
        <td>${expense.comment}</td>
        <td><button class="delete-row">Delete</button></td>
      `;

        if (typeof expense.amount === 'number' && !isNaN(expense.amount)) {
          totalAmount += expense.amount;
        }

        // Add delete row event
        const deleteButton = row.querySelector(".delete-row");
        deleteButton.addEventListener("click", function() {
          deleteExpense(index); 
        });
      });
      
      document.getElementById("totalAmount").textContent = totalAmount.toFixed(2);
    }

    // Populate category-wise expense table
    if (categoryTableBody) {
      categoryTableBody.innerHTML = '';
      const categoryTotals = {};
      expenses.forEach(expense => {
        if (typeof expense.amount === 'number' && !isNaN(expense.amount)) {
          if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
          }
          categoryTotals[expense.category] += expense.amount;
        }
      });

      let grandTotal = 0;
      Object.keys(categoryTotals).forEach(category => {
        const row = categoryTableBody.insertRow();
        row.innerHTML = `
          <td>${category}</td>
          <td>${categoryTotals[category].toFixed(2)}</td>
        `;
        grandTotal += categoryTotals[category];
      });

      const grandTotalRow = categoryTableBody.insertRow();
      grandTotalRow.innerHTML = `
        <td><strong>Grand Total</strong></td>
        <td><strong>${grandTotal.toFixed(2)}</strong></td>
      `;
    }
  }

  // Function to delete an expense
  function deleteExpense(index) {
    let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    expenses.splice(index, 1); 
    localStorage.setItem("expenses", JSON.stringify(expenses));
    loadData(); 
  }

  // Function to sort by column
  function sortByColumn(column) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
    loadData(); 
  }

  // Add sorting event listeners
  document.getElementById("sortAmount").addEventListener("click", function() {
    sortByColumn("amount");
  });

  // Filter by Category
  const filterCategoryButton = document.getElementById("filterCategory");


  filterCategoryButton.addEventListener("click", function() {
    categoryFilterVisible = !categoryFilterVisible;

    let categoryFilterDropdown = document.getElementById("categoryFilterDropdown");

    if (!categoryFilterDropdown) {
      categoryFilterDropdown = document.createElement("select");
      categoryFilterDropdown.id = "categoryFilterDropdown";
      //categoryFilterDropdown.style.zIndex = "1000"; 

      const categories = JSON.parse(localStorage.getItem("categories") || "[]");
      const allOption = document.createElement("option");
      allOption.value = "";
      allOption.textContent = "All Categories";
      categoryFilterDropdown.appendChild(allOption);

      categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilterDropdown.appendChild(option);
      });

      categoryFilterDropdown.addEventListener("change", function() {
        selectedCategory = categoryFilterDropdown.value;
        loadData();
      });

      filterCategoryButton.parentNode.appendChild(categoryFilterDropdown);
    }

    categoryFilterDropdown.style.display = categoryFilterVisible ? "block" : "none";
  });

  // Add Expense
  addExpenseButton.addEventListener("click", function() {
    const description = expenseDescription.value.trim();
    let amount = parseFloat(expenseAmount.value);
    const category = categorySelect.value;
    const unit = units.value;
    const unitNameValue = unitName.value;
    const comment = expenseComment.value.trim();

    
  
    if (description && category) {
      // Calculate amount if units and price per unit are provided
      if (units.value && pricePerUnit.value) {
        amount = parseFloat(units.value) * parseFloat(pricePerUnit.value);
        expenseAmount.value = amount; // Update the amount input
      }
  
      const expense = { 
        description, 
        amount, 
        category, 
        units: unit, 
        unitName: unitNameValue, 
        pricePerUnit: parseFloat(pricePerUnit.value) || null,
        comment 
      };
      let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      expenses.push(expense);
      localStorage.setItem("expenses", JSON.stringify(expenses));
  
      loadData();
      expenseDescription.value = '';
      expenseAmount.value = '';
      units.value = '';
      unitName.value = '';
      pricePerUnit.value = '';
      expenseComment.value = '';
    } else {
      alert("Please fill all fields correctly!");
    }
  });

    // Function to make a cell editable on double-click
    // Function to make a category cell editable on double-click
    expenseTableBody.addEventListener("dblclick", function (event) {
      const targetCell = event.target;
      const row = targetCell.closest("tr");
      if (!row) return;
    
      const columnIndex = Array.from(targetCell.parentNode.children).indexOf(targetCell);
    
      // Prevent editing if the double-clicked cell is in the 'Action' column (assuming it's the last column)
      if (columnIndex === targetCell.parentNode.children.length - 1) {
        return;  // Do nothing if double-clicked on Action column
      }
    
      // Check if the double-clicked cell is in the 'category' column (index 2)
      if (columnIndex === 2) {
        const originalValue = targetCell.textContent.trim();
        
        // Create a dropdown with available categories
        const categorySelectDropdown = document.createElement("select");
        const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    
        // Add default option and available categories
        const defaultOption = document.createElement("option");
        defaultOption.value = originalValue;
        defaultOption.textContent = originalValue;
        categorySelectDropdown.appendChild(defaultOption);
    
        categories.forEach(category => {
          const option = document.createElement("option");
          option.value = category;
          option.textContent = category;
          categorySelectDropdown.appendChild(option);
        });
    
        // Clear the cell content and append the dropdown
        targetCell.textContent = "";
        targetCell.appendChild(categorySelectDropdown);
        categorySelectDropdown.focus();
    
        // Handle saving the selected category when the dropdown loses focus
        categorySelectDropdown.addEventListener("blur", function () {
          const newCategory = categorySelectDropdown.value;
    
          // Update the category in the cell
          targetCell.textContent = newCategory;
    
          // Save the updated category to localStorage
          const rowIndex = Array.from(expenseTableBody.children).indexOf(row);
          const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    
          if (expenses[rowIndex]) {
            expenses[rowIndex].category = newCategory;  // Update the category field
            localStorage.setItem("expenses", JSON.stringify(expenses));
            loadData(); // Reload the table to reflect changes
          }
        });
    
        // Save on pressing Enter
        categorySelectDropdown.addEventListener("keypress", function (e) {
          if (e.key === "Enter") {
            categorySelectDropdown.blur();
          }
        });
      } else {
        // If not the category column, handle other editable fields as before
        const originalValue = targetCell.textContent.trim();
        const input = document.createElement("input");
        input.type = "text";
        input.value = originalValue;
        targetCell.textContent = "";
        targetCell.appendChild(input);
        input.focus();
    
        // Handle saving the updated value
        input.addEventListener("blur", function () {
          let newValue = input.value.trim();
          
          // Validate if the input is numeric for the amount, units, and price columns
          if ([editableColumns.amount, editableColumns.units, editableColumns.pricePerUnit].includes(columnIndex)) {
            if (isNaN(newValue) || newValue === '') {
              alert("Please enter a valid number.");
              input.value = originalValue;  // Revert to original value if invalid
              return;  // Stop further processing if invalid
            } else {
              newValue = parseFloat(newValue);  // Convert valid input to float
            }
          }
    
          targetCell.textContent = newValue;
    
          const rowIndex = Array.from(expenseTableBody.children).indexOf(row);
          const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    
          if (expenses[rowIndex]) {
            switch (columnIndex) {
              case editableColumns.description:
                expenses[rowIndex].description = newValue;
                break;
              case editableColumns.amount:
                expenses[rowIndex].amount = newValue;
                break;
              case editableColumns.units:
                expenses[rowIndex].units = newValue;
                break;
              case editableColumns.unitName:
                expenses[rowIndex].unitName = newValue;
                break;
              case editableColumns.pricePerUnit:
                expenses[rowIndex].pricePerUnit = newValue;
                break;
              case editableColumns.comment:
                expenses[rowIndex].comment = newValue;
                break;
            }
            localStorage.setItem("expenses", JSON.stringify(expenses));
            loadData(); // Reload the table to reflect changes
          }
        });
    
        // Save on pressing Enter
        input.addEventListener("keypress", function (e) {
          if (e.key === "Enter") {
            input.blur();
          }
        });
      }
    });
    

  
  // Add Category
  addCategoryButton.addEventListener("click", function() {
    const newCategory = newCategoryInput.value.trim();
    if (newCategory) {
      let categories = JSON.parse(localStorage.getItem("categories") || "[]");
      if (!categories.includes(newCategory)) {
        categories.push(newCategory);
        localStorage.setItem("categories", JSON.stringify(categories));
        loadData();
        newCategoryInput.value = '';
      } else {
        alert("Category already exists!");
      }
    } else {
      alert("Please enter a valid category!");
    }
  });

  // Delete Category
  document.getElementById("deleteCategoryButton").addEventListener("click", function() {
    const selectedCategoryToDelete = deleteCategorySelect.value;
    if (selectedCategoryToDelete) {
      let categories = JSON.parse(localStorage.getItem("categories") || "[]");
      categories = categories.filter(category => category !== selectedCategoryToDelete);
      localStorage.setItem("categories", JSON.stringify(categories));

      // Remove all expenses under this category
      let expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      expenses = expenses.filter(expense => expense.category !== selectedCategoryToDelete);
      localStorage.setItem("expenses", JSON.stringify(expenses));

      loadData();
    } else {
      alert("Please select a category to delete!");
    }
  });

  // Export Data
  exportDataButton.addEventListener("click", function() {
    const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
    const categories = JSON.parse(localStorage.getItem("categories") || "[]");
    const data = { expenses, categories };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "expenses.json";
    a.click();
    URL.revokeObjectURL(url);
  });

// Export Data as CSV
exportCsvButton.addEventListener("click", function() {
  const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  let csvContent = "\uFEFFDescription,Amount,Category,Units,Unit Name,Price per Unit,Comment\n"; // Add BOM (\uFEFF) for UTF-8

  expenses.forEach(expense => {
    csvContent += `${expense.description},${expense.amount},${expense.category},${expense.units},${expense.unitName},${expense.pricePerUnit},${expense.comment}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
});


  // Import Data
importDataInput.addEventListener("change", function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    const fileExtension = file.name.split(".").pop().toLowerCase();

    reader.onload = function(e) {
      try {
        if (fileExtension === "csv") {
          // Handle CSV file import
          const csvData = e.target.result;
          const lines = csvData.split("\n");
          const headers = lines[0].split(","); // Extract the headers from CSV

          // Initialize an array to hold the parsed expenses
          const expenses = [];

          // Loop through each row in CSV
          for (let i = 1; i < lines.length; i++) {
            const row = lines[i].split(",");

            // Skip empty rows or invalid rows
            if (row.length < headers.length) continue;

            // Map the CSV fields to the expense object
            const expense = {
              description: row[0].trim(),
              amount: parseFloat(row[1].trim()) || 0,  // Default to 0 if amount is not a valid number
              category: row[2].trim(),
              units: row[3].trim(),
              unitName: row[4].trim(),
              pricePerUnit: parseFloat(row[5].trim()) || 0, // Ensure it's a number
              comment: row[6].trim()
            };

            expenses.push(expense);  // Add the expense to the array
          }

          // Store the expenses in localStorage and reload data
          localStorage.setItem("expenses", JSON.stringify(expenses));

          // Ensure categories are set as well
          const categories = [...new Set(expenses.map(expense => expense.category))];
          localStorage.setItem("categories", JSON.stringify(categories));

          loadData();  // Reload the data after importing
        } else if (fileExtension === "json") {
          // Original JSON import logic
          const importedData = JSON.parse(e.target.result);
          localStorage.setItem("expenses", JSON.stringify(importedData.expenses));
          localStorage.setItem("categories", JSON.stringify(importedData.categories));
          loadData();
        } else {
          alert("Unsupported file type. Please upload a CSV or JSON file.");
        }
      } catch (error) {
        alert("Invalid file format.");
      }
    };

    reader.readAsText(file);
  }
});

  

  loadData(); 
});