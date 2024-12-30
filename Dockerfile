# Use a lightweight Node.js image as the base
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port on which the server will run
EXPOSE 3000

# Define the command to start the server
CMD ["npm", "start"]
