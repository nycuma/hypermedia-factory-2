# Hypermedia Factory

This is the practical part of my bachelor's thesis, submitted to the research group for [Service-centric Networking](https://www.snet.tu-berlin.de/) at [Technische Universität Berlin](http://www.tu-berlin.de/).

The running app can be found here: [https://nycuma.github.io/hypermedia-factory-2/](https://nycuma.github.io/hypermedia-factory-2/) (Has a few bugs... ;)

### Idea

REST has become a popular buzz word in recent years, but one of the main ideas of REST (as laid out in Roy Fielding's PhD thesis) is usually ignored: the so-called HATEOAS constraint (= hypermedia as the engine of application state). The main idea of this constraint is that messages that are returned to the client when it makes a request to an endpoint of a Web API, should be self-descriptive. They should guide the client dynamically through the application, so that the client does not have to be hard-coded to a single API, that may contain tens and hundreds of endpoints and is documented only in human-readable text ([example from Twitter API docs](https://developer.twitter.com/en/docs/tweets/post-and-engage/api-reference/post-statuses-update)).

Basically, the idea is the same as with anchor (*a*) or *link* tags in HTML documents. You visit a website and receive an HTML document that includes links to other HTML documents (if we pretend for a moment that we live in the pre-JavaScript-frontend-framework world). The problem with JSON, the main data exchange format for Web application these days, is that is does not contain any semantic information (unlike HTTP methods or HTML tags which have a common agreed-upon semantic meaning). There are a few attempts to add semantic meaning to JSON, i.e. people came up with a new specification, registered a new media type, and defined certain key words that have a special meaning when they appear in a JSON document (examples of these attempts: [HAL](https://tools.ietf.org/html/draft-kelly-json-hal-08), [Siren](https://github.com/kevinswiber/siren), [JSON API](http://jsonapi.org/)). Personally, I don't think that any of these formats is going to be used widely any time soon (though I would love to see Web applications using a semantically-enriched JSON format). 

A more promising idea is [JSON-LD](https://www.w3.org/TR/json-ld/). Instead defining its own key words, JSON-LD makes use of existing vocabularies such as [Schema.org](https://schema.org/). JSON-LD is a serialization format of the [Resource Description Format](http://www.w3.org/TR/rdf11-concepts/) (RDF). RDF is a theoretical concept that defines how information can be captured. It uses so-called triples (subject, predicate, object) as basic building blocks. A set of triples can be put together and make up a graph (just like the WWW).

### How to use the app

This app is supposed to be used in the design phase when programming a new Web application. You can create a state diagram of your application that outlines the paths that an (automated) client or user may take to navigate through your app (basically the business logic). The client moves to the next state by making use of a hypermedia link (that triggers a new HTTP request). When double-clicking on one of the nodes or links you can add semantic information to them.

Supported vocabularies for the autocomplete input fields:

*   [Schema.org](https://schema.org/)
*   [IANA Link Relation types](https://www.iana.org/assignments/link-relations)
*   [Hydra](http://www.hydra-cg.com/spec/latest/core/)

When you're done you can download a JSON-LD document that contains the information that you entered, in the state diagram. (I'm not sure if this works. However, it does work for the sample state diagram that you can see when you start the app.)

// TODO Explain in more detail

Example:

// TODO
