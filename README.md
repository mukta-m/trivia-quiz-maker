# Trivia Quiz Maker
A website that allows user w/Mongoose Schema to sign in, have profile and build trivia quizzes
## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/download/) > 10.16.3
- [Express.js](https://expressjs.com/en/starter/installing.html) 

### NPM Packages
- [connect-mongodb-session](https://www.npmjs.com/package/connect-mongodb-session)
- [express](https://www.npmjs.com/package/express)
- [express-session](https://www.npmjs.com/package/express-session)
- [mongoose](https://www.npmjs.com/package/mongoose)
- [pug](https://www.npmjs.com/package/pug)

### Instructions
(under assumption that daemon is running (terminal 1), and database is initialized)
1. ```mongo``` on terminal 2
2. ```npm install``` on terminal 3
3. ```node server.js``` on terminal 3
4. Navigate to [http://localhost:3000/](http://localhost:3000/)

> Note: cookie expires in 100 000 milliseconds

### Contains
```
    - package.json
    - views
        - partials
            - header.pug
        - pages
            - error.pug
            - user.pug
            - userIndex.pug 
            - quiz.txt 
            - quiz.pug 
            - index.pug 
    - UserModel.js 
    - server.js 
    - QuestionModel.js 
    - public 
        - js 
            - quiz.js 
    - database-initalizer.js 
```

### Issues
- None !
