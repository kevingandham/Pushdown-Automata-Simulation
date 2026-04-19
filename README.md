# Pushdown Automata (PDA) Stack Simulator

This project is a web-based simulator designed to demonstrate the working of a Pushdown Automaton (PDA). It provides a step-by-step visualization of how input strings are processed using stack operations and state transitions.

---

## Overview

The simulator models the behavior of a PDA for selected context-free languages. It allows users to observe how the automaton processes input symbols, manipulates the stack, and transitions between states during computation.

---

## Features

### Core Simulation

* Step-by-step execution of PDA operations
* Automatic execution mode with adjustable speed
* Real-time stack visualization

### State Visualization

* Displays states and transitions
* Highlights the current active state during execution

### Input Tracking

* Visual pointer indicating the current input symbol
* Sequential progression through the input string

### Phase Identification

* Identifies execution phases such as push phase, pop phase, and transition phase

### Error Handling

* Detects invalid input patterns
* Highlights the position where the error occurs
* Stops execution on invalid transitions

### Computation Summary

* Total number of steps executed
* Number of push and pop operations
* Maximum stack depth reached
* Final stack configuration

### Language Comparison

* Evaluates the same input across multiple languages
* Displays acceptance or rejection results for each case

### Formal Definition Display

* Shows transition rules in formal notation
* Highlights the rule applied at each step

### Result Explanation

* Provides reasoning for acceptance or rejection based on stack behavior and transitions

---

## Supported Languages

* aⁿ bⁿ
* aⁿ bⁿ cⁿ

---

## Technology Stack

* HTML
* CSS
* JavaScript

---

## Project Structure

```text
/project-root
│── index.html
│── style.css
│── script.js
│── static.json
```

---

## Deployment

The project is deployed as a static site using Render.

Configuration:

* Environment: Static Site
* Build Command: None
* Publish Directory: Root directory

---

## Running Locally

1. Clone or download the project files
2. Open index.html in a web browser

---

## Learning Objectives

This project demonstrates key concepts from Theory of Computation, including:

* Pushdown Automata
* Stack-based computation
* Context-free language recognition
* State transitions and execution flow

---

## Author

Kevin Gandham
