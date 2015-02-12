#!/bin/bash

if [ -z "$OPENSHIFT_NODEJS_IP" ]; then
    OPENSHIFT_NODEJS_IP="127.0.0.1"
fi

if [ -z "$OPENSHIFT_NODEJS_PORT" ]; then
    OPENSHIFT_NODEJS_PORT="8080"
fi

curl $OPENSHIFT_NODEJS_IP:$OPENSHIFT_NODEJS_PORT"/api/1/event/remind"
