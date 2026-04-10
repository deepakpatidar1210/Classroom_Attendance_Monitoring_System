FROM python:3.11-slim

# System dependencies — dlib aur face_recognition ke liye zaroori
RUN apt-get update && apt-get install -y \
    cmake \
    gcc \
    g++ \
    libx11-6 \
    libx11-dev \
    libopenblas-dev \
    liblapack-dev \
    libboost-python-dev \
    libboost-thread-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

# dlib pehle alag install karo (time lagta hai)
RUN pip install --no-cache-dir cmake
RUN pip install --no-cache-dir dlib==19.24.2
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE $PORT

CMD gunicorn -w 4 -b 0.0.0.0:$PORT app:app --timeout 120 --preload
