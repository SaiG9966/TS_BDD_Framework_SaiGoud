@practiceForm
Feature: Practice Form

Scenario: Submit student registration form successfully

Given user navigates to practice form page
When user enters student first name "faker"
And user enters student last name "faker"
And user enters student email "faker"
And user selects student gender "random"
And user enters mobile number "faker"
And user selects date of birth
And user enters subject "Maths"
And user selects hobby "Sports"
And user uploads picture
And user enters address "faker"
And user selects state "NCR"
And user selects city "Delhi"
And user clicks submit button
Then registration should be successful