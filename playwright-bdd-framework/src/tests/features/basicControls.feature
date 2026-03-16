@basicControls
Feature: HYR basicControls Module

  Scenario: User registers with valid details
    Given user is on the registration page
    When user enters first name "faker"
    And user enters last name "faker"
    And user selects gender "random"
    And user selects languages "English" and "Hindi"
    And user enters email "faker"
    And user enters password "faker"
    And user clicks on Register button
    Then user should be successfully registered
  # Fresh template only.
  # Add your own scenarios in this folder.
