import ssl
import json
import msgpack

from kafka import KafkaProducer, KafkaConsumer
from kafka.client_async import KafkaClient
from kafka.consumer import group


def ssl_contexts():
    
    context = ssl.create_default_context(purpose=ssl.Purpose.CLIENT_AUTH,cafile='D:/test2/ca.crt')
    context.load_cert_chain(certfile='D:/test2/cerfiticate.crt',
                        keyfile='D:/test2/private.key',
                        password='<YOUR_KAFKA_PASSWORD>',  )
    
    return context


def send_message(topics: str, mes: str, key: str):

    context = ssl_contexts()

    p = KafkaProducer(bootstrap_servers=['your-kafka-tw-1.example.com:9093','your-kafka-tw-2.example.com:9093', 'your-kafka-tw-3.example.com:9093','your-kafka-sg-4.example.com:9093','your-kafka-sg-5.example.com:9093','your-kafka-sg-6.example.com:9093'],
                      security_protocol='SSL',
                      ssl_context=context)


    future = p.send(topics, value = bytes(mes, 'UTF-8'), key = bytes(key, 'UTF-8'))
    result = future.get(timeout=5)
    ss = p.flush()
    print(result)


def get_message():
    
    context = ssl_contexts()

    my_topic = "salesforce-case-noti-dev"
    my_group = '1'
    
    consumer  = KafkaConsumer(my_topic, bootstrap_servers=['your-kafka-tw-1.example.com:9093','your-kafka-tw-2.example.com:9093', 'your-kafka-tw-3.example.com:9093','your-kafka-sg-4.example.com:9093','your-kafka-sg-5.example.com:9093','your-kafka-sg-6.example.com:9093'], security_protocol="SSL",
                            auto_offset_reset='earliest',
                            #value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                            ssl_context=context
                            )

    list_consumer = []

    try:


        for message in consumer:
            
            print(json.loads(message.value))    
            print("%s:%d:%d: | key=%s | value=%s" % (message.topic, message.partition, message.offset, message.key, message.value))
            if '1046752009' in str(json.loads(message.value)):
                list_consumer.append(str(json.d(message.value)))
                continue
        
    except Exception as err:

        print(repr(err))

    print(list_consumer)

         

    # KafkaConsumer(auto_offset_reset='earliest', enable_auto_commit=False)
    # KafkaConsumer(value_deserializer=lambda m: json.loads(m.decode('utf-8')))
    # KafkaConsumer(value_deserializer=msgpack.unpackb)
    # KafkaConsumer(consumer_timeout_ms=1000)

    #consumer = KafkaConsumer()
    # consumer.subscribe(topics=my_topic, pattern='^104675200901$')
    # consumer.assign()
    # for message in consumer:

    #     print ("%d:%d: v=%s" % (message.partition,
    #                         message.offset,
    #                         message.value)) 
        

    # Use multiple consumers in parallel w/ 0.9 kafka brokers
    # typically you would run each on a different server / process / CPU
    # consumer1 = KafkaConsumer(my_topic=my_topic,
    #                         group_id=my_group,
    #                         bootstrap_servers='your-kafka-1.example.com:9093')

    # consumer2 = KafkaConsumer(my_topic=my_topic,
    #                         group_id=my_group,
    #                         bootstrap_servers='your-kafka-2.example.com:9093')

    # consumer3 = KafkaConsumer(my_topic=my_topic,
    #                         group_id=my_group,
    #                         bootstrap_servers='your-kafka-3.example.com:9093')





if __name__ == "__main__":
    #send_message('c1.b2b-platform.shipment-event.qc', 'valueeee', 'Keyyyyyyyy')
    get_message()