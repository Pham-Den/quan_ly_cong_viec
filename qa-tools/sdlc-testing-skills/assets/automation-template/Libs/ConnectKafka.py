import ssl
import os

from kafka import KafkaProducer


def send_message(topics: str, mes: str, key='autotest'):
    context = ssl.create_default_context(purpose=ssl.Purpose.CLIENT_AUTH,
                                         cafile='C:/Kafka/kafka-int-ca.crt')
    context.load_cert_chain(certfile='C:/Kafka/your-kafka-client.cer',
                            keyfile='C:/Kafka/your-kafka-client.key',
                            password=os.environ['KAFKA_PASSWORD'])          #os.environ['KAFKAPASSWORD']

    p = KafkaProducer(bootstrap_servers=['your-kafka-1.example.com:9093', 'your-kafka-2.example.com:9093',
                                         'your-kafka-3.example.com:9093'],
                      security_protocol='SSL',
                      ssl_context=context)
    # ssl_cafile='C:/Kafka/your-kafka-ca.crt',
    # ssl_certfile='C:/Kafka/your-kafka-client.cer',
    # ssl_keyfile='C:/Kafka/your-kafka-client.key',
    # ssl_password='<YOUR_KAFKA_PASSWORD>')
    future = p.send(topics, key = bytes(key, 'UTF-8'), value = bytes(mes, 'UTF-8'))
    result = future.get(timeout=60)
    p.flush()
    print(result)


if __name__ == "__main__":
    send_message('c1.b2b-platform.shipment-event.qc', 'iklm1vccvccv1111')
