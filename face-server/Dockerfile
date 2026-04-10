FROM python:3.10-slim

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gcc \
    g++ \
    libopenblas-dev \
    liblapack-dev \
    libx11-6 \
    libx11-dev \
    libboost-python-dev \
    libboost-thread-dev \
    python3-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip cmake
RUN pip install --no-cache-dir dlib
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE $PORT

CMD gunicorn -w 4 -b 0.0.0.0:$PORT app:app --timeout 120 --preload
