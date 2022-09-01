FROM python:3.8

ENV SRC_DIR /usr/bin/src/webapp/src

COPY . ${SRC_DIR}/

WORKDIR ${SRC_DIR}

#python sends print and log statements directly to stdout
ENV PYTHONUNBUFFERED=1

CMD ["python", "servewasm.py", "--port", "80"]
