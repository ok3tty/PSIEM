# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
#COPY package*.json ./
#RUN npm install

# Copy the rest of the source code
COPY . .

# Build the React app
# RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start the React development server
# CMD ["npm", "start"]
