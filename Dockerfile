FROM mhart/alpine-node:8
ENV NODE_ENV production
RUN mkdir /root/temperature_hub_poll
COPY ./build /root/temperature_hub_poll/
COPY ./package.json /root/temperature_hub_poll/package.json
COPY ./start.sh /root/temperature_hub_poll/start.sh
WORKDIR /root/temperature_hub_poll
RUN echo "* * * * *  node /root/temperature_hub_poll/main.js >> /var/log/tp.log 2>&1 " >> /etc/crontabs/root
RUN npm install
EXPOSE 80
ENTRYPOINT ["/root/temperature_hub_poll/start.sh"]
